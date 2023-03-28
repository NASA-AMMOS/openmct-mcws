let clearOutOfAlarmRows = {
    name: 'Clear out-of-alarm rows',
    key: 'vista.alarms.clear-out-of-alarm-rows',
    description: "Clear rows that are out of alarm",
    cssClass: 'icon-clear-data',
    invoke: (objectPath, viewProvider) => {
        viewProvider.getViewContext().clearOutOfAlarmRows();
    },
    group: 'view'
};

let viewActions = [
    clearOutOfAlarmRows
];

viewActions.forEach(action => {
    action.appliesTo = (objectPath, viewProvider = {}) => {
        let viewContext = viewProvider.getViewContext && viewProvider.getViewContext();

        if (viewContext) {
            let alarmsView = viewContext['vista.alarmsView'];

            return alarmsView === true;
        }

        return false;
    };
});

export default viewActions;
