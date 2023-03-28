<template>
<div class="c-inspect-properties">
    <template v-if="isEditing">
        <div class="c-inspect-properties__header">
            EVR Levels
        </div>
        <ul class="c-inspect-properties__section">
            <li
                v-for="(isEnabled, key) in levels"
                :key="key"
                class="c-inspect-properties__row"
            >
                <div
                    class="c-inspect-properties__label"
                    :title="key"
                >
                    <label
                        :for="key"
                        :style="levelsStyles[key]"
                    >
                        {{ key }}
                    </label>
                </div>
                <div class="c-inspect-properties__value">
                    <input
                        :id="key"
                        type="checkbox"
                        :checked="isEnabled"
                        @change="toggleLevelEnabled(key)"
                    >
                </div>
            </li>
        </ul>
    </template>
</div>
</template>
<script>
export default {
    inject: ['openmct'],
    props: {
        options: {
            type: Object,
            required: true
        },
        domainObject: {
            type: Object,
            required: true
        }
    },
    computed: {
        levels() {
            const existingLevels = this.domainObject.configuration && this.domainObject.configuration.levels;
            // Assign in this order to maintain level order as specified in config
            // evrForegroundColorByLevel and evrBackgroundColorByLevel should have identical keys
            const levels = Object.assign(
                {},
                this.options.evrForegroundColorByLevel,
                this.options.evrBackgroundColorByLevel,
                existingLevels
            );

            Object.keys(levels).forEach(key => {
                levels[key] = Boolean(levels[key]);
            });

            if (this.options.evrDefaultForegroundColor || this.options.evrDefaultBackgroundColor) {
                levels.DEFAULT = true;
            }

            return levels;
        },
        levelsStyles() {
            const styles = {};

            Object.keys(this.levels).forEach(key => {
                const foregroundColor = key === 'DEFAULT'
                    ? this.options.evrDefaultForegroundColor
                    : this.options.evrForegroundColorByLevel[key];
                const backgroundColor = key === 'DEFAULT'
                    ? this.options.evrDefaultBackgroundColor
                    : this.options.evrBackgroundColorByLevel[key];
                
                styles[key] = {};

                if (foregroundColor) {
                    styles[key].color = foregroundColor;
                }

                if (backgroundColor) {
                    styles[key].background = backgroundColor;
                }
            });
            
            return styles;
        }
    },
    data() {
        return {
            isEditing: this.openmct.editor.isEditing()
        };
    },
    methods: {
        toggleEdit(isEditing) {
            this.isEditing = isEditing;
        },
        toggleLevelEnabled(key) {
            const levels = this.levels;
            levels[key] = !levels[key];
            
            this.openmct.objects.mutate(this.domainObject, 'configuration.levels', levels);
        }
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.toggleEdit);
    },
    destroyed() {
        this.openmct.editor.off('isEditing', this.toggleEdit);
    }
}
</script>
