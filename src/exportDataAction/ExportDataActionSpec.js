define(['./ExportDataAction'], (ExportDataActionModule) => {
  const ExportDataAction = ExportDataActionModule.default;

  describe('The Export Data action', () => {
    let mockOpenmct;
    let mockCompositionCollection;
    let mockComposition;
    let mockTelemetryObject;
    let mockRealtimeOnlyTelemetryObject;
    let mockTelemetryObjectWithComposition;
    let mockNotification;
    let telemetryPromises;
    let exportDataAction;
    let telemetryRequested;
    let telemetryRequestCount;

    function makeMockDomainObject(id, telemetry, realtimeOnly) {
      let mockDomainObject = {
        identifier: {
          namespace: 'object',
          key: id
        },
        type: 'validType'
      };

      if (telemetry) {
        mockDomainObject.telemetry = {};
      }

      if (realtimeOnly) {
        mockDomainObject.realtimeOnly = true;
      }

      return mockDomainObject;
    }

    function telemetryPromise() {
      return new Promise((resolve, reject) => {
        telemetryPromises.push({ resolve, reject });
        setTimeout(telemetryRequested);
      });
    }

    beforeEach(() => {
      telemetryPromises = [];
      telemetryRequested = jasmine.createSpy('telemetryRequested').and.callFake(() => {
        telemetryRequestCount--;
        if (telemetryRequestCount === 0) {
          telemetryRequested.done();
        }
      });

      mockOpenmct = jasmine.createSpyObj('mockOpenmct', [
        'notifications',
        'composition',
        'telemetry'
      ]);
      mockTelemetry = [];
      mockCompositionCollection = jasmine.createSpyObj('compositionCollection', ['load']);
      mockCompositionCollection.load.and.returnValue(Promise.resolve(mockComposition));
      mockOpenmct.composition = jasmine.createSpyObj('composition', ['get']);
      mockOpenmct.composition.get.and.returnValue(mockCompositionCollection);
      mockOpenmct.telemetry = jasmine.createSpyObj('telemetry', ['isTelemetryObject', 'request']);
      mockOpenmct.telemetry.request.and.callFake(telemetryPromise);
      mockOpenmct.telemetry.isTelemetryObject.and.callFake((object) => {
        return object.telemetry;
      });
      mockOpenmct.notifications = jasmine.createSpyObj('notificationService', [
        'error',
        'progress',
        'info'
      ]);
      mockNotification = jasmine.createSpyObj('notification', ['dismiss']);
      mockTelemetryObject = makeMockDomainObject('singular', true);
      mockRealtimeOnlyTelemetryObject = makeMockDomainObject('singular', true, true);
      mockTelemetryObjectWithComposition = makeMockDomainObject('composition');

      mockOpenmct.notifications.progress.and.returnValue(mockNotification);

      exportDataAction = new ExportDataAction(mockOpenmct, ['validType']);
    });

    it('applies to objects with a valid type', () => {
      expect(exportDataAction.appliesTo([mockTelemetryObject])).toBe(true);
    });

    it('does not apply to realtime only telemetry objects', (done) => {
      telemetryRequested.and.callFake(done);
      exportDataAction.invoke([mockRealtimeOnlyTelemetryObject]).then(() => {
        expect(mockOpenmct.notifications.info).toHaveBeenCalledWith('No historical data to export');
      });
    });

    [false, true].forEach((singular) => {
      let targetDescription;

      if (singular) {
        targetDescription = 'a single object';
      } else {
        targetDescription = 'multiple objects';
        mockComposition = [
          makeMockDomainObject('composition-1', true),
          makeMockDomainObject('composition-2', true)
        ];
      }

      describe('when performed on ' + targetDescription, () => {
        let mockTarget;

        beforeEach((done) => {
          let doneCalled = false;
          const callDoneOnce = () => {
            if (!doneCalled) {
              doneCalled = true;
              done();
            }
          };

          spyOn(exportDataAction, 'runExportTask').and.callThrough();
          spyOn(exportDataAction, 'exportCompositionData').and.callThrough();
          mockTarget = singular ? mockTelemetryObject : mockTelemetryObjectWithComposition;
          telemetryRequestCount = singular ? 1 : mockComposition.length;
          telemetryRequested.done = callDoneOnce;
          exportDataAction.invoke([mockTarget]).finally(callDoneOnce);
        });

        it('shows a progress notification', () => {
          expect(mockOpenmct.notifications.progress).toHaveBeenCalled();
        });

        if (singular) {
          it('initiates a telemetry request', () => {
            expect(telemetryPromises.length).toEqual(1);
          });
        } else {
          it('initiates telemetry requests', () => {
            expect(telemetryPromises.length).toEqual(mockComposition.length);
          });
        }

        describe('and data is provided', () => {
          beforeEach((done) => {
            telemetryPromises.forEach((promise) => {
              promise.resolve([]);
            });
            setTimeout(done, 0); // Ensure all promises are resolved
          });

          it('does not show an error notification', () => {
            expect(mockOpenmct.notifications.error).not.toHaveBeenCalled();
          });

          it('dismisses its progress notification', (done) => {
            setTimeout(() => {
              expect(mockNotification.dismiss).toHaveBeenCalled();
              done();
            }, 0);
          });

          if (singular) {
            it('triggers a CSV export for one object', () => {
              expect(exportDataAction.runExportTask).toHaveBeenCalled();
            });
          } else {
            it('triggers a CSV export for each object', () => {
              expect(exportDataAction.exportCompositionData).toHaveBeenCalled();
            });
          }
        });

        describe('and a request failure occurs', () => {
          beforeEach((done) => {
            telemetryPromises.forEach((promise) => {
              promise.reject();
            });
            done();
          });

          it('dismisses its progress notification', () => {
            expect(mockNotification.dismiss).toHaveBeenCalled();
          });

          it('displays an error notification', () => {
            expect(mockOpenmct.notifications.error).toHaveBeenCalled();
          });
        });
      });
    });
  });
});
