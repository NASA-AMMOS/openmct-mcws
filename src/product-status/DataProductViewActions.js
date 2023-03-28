let clearCompleted = {
    name: 'Clear Completed',
    key: 'data-product-clear-completed',
    description: "Clear completed Data Products",
    cssClass: 'icon-clear-data',
    invoke: (objectPath, viewProvider) => {
        viewProvider.getViewContext().clearCompleted();
    },
    group: 'view'
};
let clearPartial = {
    name: 'Clear Partially Completed',
    key: 'data-product-clear-partially-completed',
    description: 'Clear partially completed Data Products',
    cssClass: 'icon-clear-data',
    invoke: (objectPath, viewProvider) => {
        viewProvider.getViewContext().clearPartial();
    },
    group: 'view'
};

let viewActions = [
    clearCompleted,
    clearPartial
];

viewActions.forEach(action => {
    action.appliesTo = (objectPath, viewProvider = {}) => {
        let viewContext = viewProvider.getViewContext && viewProvider.getViewContext();

        if (viewContext) {
            let dataProductView = viewContext.dataProductView;

            return dataProductView === true;
        }

        return false;
    };
});

export default viewActions;