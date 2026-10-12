#!/usr/bin/env python3
"""
AMPCS Controller Client - WebSocket client for handling command and config messages
Connects to AMPCS uplink controller and processes command/configuration requests
"""
import asyncio
import websockets
import json
import sys
import subprocess
import os
import re
from pathlib import Path

class AMPCSControllerClient:
    def __init__(self, venue_config_path='venue_config.json'):
        self.venue_config_path = venue_config_path
        self.venue_config = {}
        self.controller_url = "/controller"
        self.websocket = None
        self.active_sessions = {}  # Maps "<host>_<port>" -> {'session_key': key, 'process': process, 'config': config, 'host': host, 'port': port}

    def load_venue_config(self):
        """Load default venue configuration from JSON file"""
        try:
            config_path = Path(self.venue_config_path)
            if config_path.exists():
                with open(config_path, 'r') as f:
                    self.venue_config = json.load(f)
                print(f"Loaded venue configuration: {self.venue_config}")
            else:
                print(f"Warning: {self.venue_config_path} not found, using empty config")
                self.venue_config = {
                    'uplinkHost': '127.0.0.1',
                    'uplinkPort': '9825',
                    'scid': '252',
                    'venue': 'TESTSET'
                }
        except Exception as e:
            print(f"Error loading venue config: {e}")
            self.venue_config = {}

    def parse_command_to_string(self, command_msg):
        """
        Convert command JSON to shorthand string format.
        Example: {"stem":"SENDENUM","arguments":[{"sspa":"0"}]} -> "SENDENUM,0"
        """
        stem = command_msg.get('stem', '')
        arguments = command_msg.get('arguments', [])

        # Extract argument values in order
        arg_values = []
        for arg in arguments:
            # Each argument is a single-key dict, get the value
            if isinstance(arg, dict):
                for _, value in arg.items():
                    arg_values.append(str(value))

        # Build shorthand string
        if arg_values:
            return f"{stem},{','.join(arg_values)}"
        else:
            return stem

    def handle_config_message(self, config_msg):
        """Handle configuration message by updating in-memory config"""
        # Remove message_type field and update config
        new_config = {k: v for k, v in config_msg.items() if k != 'message_type'}
        self.venue_config.update(new_config)
        print(f"Configuration updated: {self.venue_config}")

    async def handle_command_message(self, command_msg):
        """Handle command message by parsing to string format and executing via chill_send_cmd"""
        command_string = self.parse_command_to_string(command_msg)
        print(f"Command received: {command_string}")
        print(f"  Full JSON: {json.dumps(command_msg, separators=(',', ':'))}")
        print(f"  Control Type: {command_msg.get('control_type', 'immediate')}")

        # Extract delay if control_type is delayed
        delay = 0
        if command_msg.get('control_type') == 'delayed':
            delay = command_msg.get('delay', 0)
            print(f"  Delay: {delay} seconds")

        print(f"  Using config: {self.venue_config}")

        # Execute chill_send_cmd with venue configuration and delay
        await self.execute_command(command_string, delay)

        return command_string

    async def execute_command(self, command_string, delay=0):
        """Execute chill_send_cmd subprocess and send output back via websocket

        Args:
            command_string: The command to execute
            delay: Optional delay in seconds before executing the command
        """
        try:
            # Apply delay if specified
            if delay > 0:
                print(f"Applying delay of {delay} seconds before execution...")
                await asyncio.sleep(delay)
                print(f"Delay complete, executing command now")

            # Build command with venue configuration parameters
            uplink_host = self.venue_config.get('uplinkHost', '127.0.0.1')
            uplink_port = self.venue_config.get('uplinkPort', '9825')
            scid = self.venue_config.get('scid', '252')
            venue = self.venue_config.get('venue', 'TESTSET')

            cmd = [
                "/ammos/ampcs/mpcs/generic/current/bin/chill_send_cmd",
                command_string,  # Command as first argument
                "-B", uplink_port,
                "--fswUplinkHost", uplink_host,
                "-S", scid,
                "-V", venue
            ]

            print(f"Executing: {' '.join(cmd)}")

            # Get current environment
            current_env = os.environ.copy()

            # Start subprocess
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=current_env
            )

            # Wait for process to complete and collect output
            stdout, stderr = await process.communicate()

            # Process output line by line
            for line in stdout.decode('utf-8').splitlines():
                if line.strip():
                    print(f"  Output: {line.strip()}")
                    # Send output back to controller websocket
                    await self.send_output_message(line.strip())

            # Process errors if any
            for line in stderr.decode('utf-8').splitlines():
                if line.strip():
                    print(f"  Error: {line.strip()}")
                    await self.send_output_message(f"ERROR: {line.strip()}")

            # Wait for process to complete
            return_code = process.returncode
            if return_code == 0:
                print(f"Command executed successfully")
                await self.send_output_message(f"Command '{command_string}' completed successfully")
            else:
                print(f"Command failed with return code: {return_code}")
                await self.send_output_message(f"Command '{command_string}' failed with return code {return_code}")

        except Exception as e:
            error_msg = f"Error executing command: {e}"
            print(error_msg)
            import traceback
            traceback.print_exc()
            await self.send_output_message(error_msg)

    async def create_downlink_session(self, downlink_config):
        """Create a new chill_down session with specified configuration"""
        try:
            venue = downlink_config.get('venue', 'TESTSET')
            connection_type = downlink_config.get('connectionType', 'SERVER_SOCKET')
            port = downlink_config.get('port', '9828')
            input_format = downlink_config.get('inputFormat', 'RAW_TF')
            connection_host = downlink_config.get('host', '127.0.0.1')

            cmd = [
                "/ammos/ampcs/mpcs/generic/current/bin/chill_down",
                "-V", venue,
                "-A", connection_host,
                "-c", connection_type,
                "-C", str(port),
                "-f", input_format,
                "-a",
                "-H"
            ]

            print(f"Creating downlink session: {' '.join(cmd)}")

            # Get current environment
            current_env = os.environ.copy()

            # Start subprocess with pipes to capture output
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=current_env
            )

            # Store process temporarily while we parse the session key
            session_key = None

            # Read output line by line to find session key
            async def read_output():
                nonlocal session_key
                try:
                    async for line in process.stdout:
                        line_text = line.decode('utf-8').strip()
                        if line_text:
                            print(f"  [STDOUT] {line_text}")
                            await self.send_output_message(line_text)

                            # Check for session started message and extract key
                            # Look for pattern: (key [number])
                            match = re.search(r'\(key\s+(\d+)\)', line_text)
                            if match:
                                session_key = match.group(1)
                                print(f"  ✓ Session key identified: {session_key}")
                                await self.send_output_message(f"✓ Session key: {session_key}")
                except Exception as e:
                    print(f"Error reading stdout: {e}")
                    import traceback
                    traceback.print_exc()

            # Read stderr as well
            async def read_stderr():
                try:
                    async for line in process.stderr:
                        line_text = line.decode('utf-8').strip()
                        if line_text:
                            print(f"  [STDERR] {line_text}")
                            await self.send_output_message(f"[ERROR] {line_text}")
                except Exception as e:
                    print(f"Error reading stderr: {e}")

            # Create composite key from host and port
            session_id = f"{connection_host}_{port}"

            # Store session immediately with 'not_assigned' key
            self.active_sessions[session_id] = {
                'session_key': 'not_assigned',
                'process': process,
                'config': downlink_config,
                'host': connection_host,
                'port': port
            }
            print(f"Session stored on {connection_host}:{port} (id: {session_id}) with key: not_assigned (waiting for actual key...)")

            # Start reading output in background - this will update the session_key when found
            async def monitor_and_update_key():
                nonlocal session_key
                # Wait for read_output to find the key (it runs indefinitely)
                while session_key is None and process.returncode is None:
                    await asyncio.sleep(0.5)

                if session_key:
                    # Update the stored session with the actual key
                    self.active_sessions[session_id]['session_key'] = session_key
                    print(f"✓ Updated session on {connection_host}:{port} with key={session_key}")
                    await self.send_output_message(f"✓ Session key identified: {session_key} for {connection_host}:{port}")
                    # Send session created confirmation with actual key
                    await self.send_session_status(port, connection_host, session_key, 'created')
                else:
                    print(f"⚠ Process ended without finding session key for {connection_host}:{port}")

            asyncio.create_task(read_output())
            asyncio.create_task(read_stderr())
            asyncio.create_task(monitor_and_update_key())

        except Exception as e:
            error_msg = f"Error creating downlink session: {e}"
            print(error_msg)
            import traceback
            traceback.print_exc()
            await self.send_output_message(error_msg)

    async def query_active_sessions(self):
        """Query and return list of active downlink sessions"""
        try:
            sessions = []
            for session_id, session_info in self.active_sessions.items():
                sessions.append({
                    'port': session_info['port'],
                    'session_key': session_info['session_key'],
                    'host': session_info['host']
                })

            # Send active sessions response
            message = {
                "message_type": "active_sessions_response",
                "sessions": sessions
            }
            await self.websocket.send(json.dumps(message))
            print(f"Sent active sessions response: {json.dumps(message)}")

        except Exception as e:
            error_msg = f"Error querying active sessions: {e}"
            print(error_msg)
            await self.send_output_message(error_msg)

    async def teardown_downlink_session(self, port, host='127.0.0.1'):
        """Teardown a downlink session by host and port"""
        port = str(port)
        host = str(host)
        session_id = f"{host}_{port}"

        if session_id not in self.active_sessions:
            error_msg = f"No active session found on {host}:{port}"
            print(error_msg)
            await self.send_output_message(error_msg)
            return

        session_info = self.active_sessions[session_id]
        session_key = session_info['session_key']
        process = session_info['process']

        print(f"Tearing down session on {host}:{port} (key {session_key})")

        try:
            # Check if process is already terminated
            if process.returncode is not None:
                print(f"Process already exited with return code {process.returncode}")
                # Remove from active sessions since it's already dead
                del self.active_sessions[session_id]
                await self.send_output_message(f"Session on {host}:{port} was already terminated")
                await self.send_session_status(port, host, session_key, 'terminated')
                return

            # Send SIGTERM to gracefully terminate
            print(f"Sending SIGTERM to process (PID: {process.pid})")
            process.terminate()

            # Wait up to 5 seconds for graceful termination
            try:
                await asyncio.wait_for(process.wait(), timeout=5.0)
                print(f"Process terminated gracefully with return code {process.returncode}")
            except asyncio.TimeoutError:
                # Process didn't terminate gracefully, force kill
                print(f"Process didn't terminate within 5 seconds, sending SIGKILL")
                process.kill()

                # Wait up to 3 more seconds for kill to take effect
                try:
                    await asyncio.wait_for(process.wait(), timeout=3.0)
                    print(f"Process killed with return code {process.returncode}")
                except asyncio.TimeoutError:
                    # This should rarely happen, but if it does, we have a problem
                    error_msg = f"Process on {host}:{port} could not be killed (PID: {process.pid})"
                    print(f"ERROR: {error_msg}")
                    await self.send_output_message(f"ERROR: {error_msg}")
                    # Don't remove from active_sessions since the process might still be running
                    return

            # Only remove from active sessions after confirming the process has exited
            if process.returncode is not None:
                del self.active_sessions[session_id]
                success_msg = f"Downlink session on {host}:{port} (key {session_key}) terminated (exit code: {process.returncode})"
                print(success_msg)
                await self.send_output_message(success_msg)
                await self.send_session_status(port, host, session_key, 'terminated')
            else:
                # This shouldn't happen, but handle it just in case
                error_msg = f"Process termination status unclear for {host}:{port}"
                print(f"WARNING: {error_msg}")
                await self.send_output_message(f"WARNING: {error_msg}")

        except Exception as e:
            error_msg = f"Error tearing down session on {host}:{port}: {e}"
            print(error_msg)
            import traceback
            traceback.print_exc()
            await self.send_output_message(error_msg)
            # Don't remove from active_sessions if there was an error

    async def send_session_status(self, port, host, session_key, status):
        """Send session status update to websocket"""
        if self.websocket:
            try:
                message = {
                    "message_type": "session_status",
                    "port": port,
                    "host": host,
                    "session_key": session_key,
                    "status": status
                }
                await self.websocket.send(json.dumps(message))
            except Exception as e:
                print(f"Error sending session status: {e}")

    async def send_output_message(self, output_text):
        """Send output message back to controller websocket"""
        if self.websocket:
            try:
                message = {
                    "message_type": "output",
                    "text": output_text
                }
                await self.websocket.send(json.dumps(message))
            except Exception as e:
                print(f"Error sending output message: {e}")

    async def process_message(self, message):
        """Process incoming message based on message_type"""
        try:
            msg_data = json.loads(message)
            message_type = msg_data.get('message_type')

            if message_type == 'config':
                print("\n=== Configuration Message ===")
                self.handle_config_message(msg_data)
            elif message_type == 'command':
                print("\n=== Command Message ===")
                await self.handle_command_message(msg_data)
            elif message_type == 'downlink_config':
                print("\n=== Downlink Configuration Message ===")
                await self.create_downlink_session(msg_data)
            elif message_type == 'query_active_sessions':
                print("\n=== Query Active Sessions ===")
                await self.query_active_sessions()
            elif message_type == 'downlink_session_exit':
                print("\n=== Downlink Session Exit ===")
                port = msg_data.get('port')
                host = msg_data.get('host', '127.0.0.1')  # Default to 127.0.0.1 for backward compatibility
                if port:
                    await self.teardown_downlink_session(port, host)
                else:
                    print("Error: No port specified for session exit")
            else:
                print(f"Unknown message type: {message_type}")
                print(f"Message: {message}")
        except json.JSONDecodeError as e:
            print(f"Error decoding message: {e}")
            print(f"Raw message: {message}")
        except Exception as e:
            print(f"Error processing message: {e}")
            import traceback
            traceback.print_exc()

    async def connect_and_listen(self):
        """Connect to AMPCS controller websocket and listen for messages"""
        print(f"Connecting to {self.controller_url}...")

        try:
            async with websockets.connect(
                self.controller_url,
                ping_interval=30,
                ping_timeout=10
            ) as websocket:
                self.websocket = websocket
                print(f"Connected to {self.controller_url}")

                # Listen for messages
                async for message in websocket:
                    await self.process_message(message)

        except websockets.exceptions.WebSocketException as e:
            print(f"WebSocket error: {e}")
        except Exception as e:
            print(f"Connection error: {e}")
            import traceback
            traceback.print_exc()

    async def run(self):
        """Main run loop with automatic reconnection"""
        self.load_venue_config()

        while True:
            try:
                await self.connect_and_listen()
            except KeyboardInterrupt:
                print("\nShutting down...")
                break
            except Exception as e:
                print(f"Error in main loop: {e}")

            # Wait before reconnecting
            print("Reconnecting in 5 seconds...")
            await asyncio.sleep(5)

def main():
    if len(sys.argv) > 1:
        venue_config_path = sys.argv[1]
    else:
        venue_config_path = 'venue_config.json'

    print("=== AMPCS Controller Client ===")
    print(f"Venue config: {venue_config_path}")

    client = AMPCSControllerClient(venue_config_path)

    try:
        asyncio.run(client.run())
    except KeyboardInterrupt:
        print("\nShutdown complete")

if __name__ == '__main__':
    main()
