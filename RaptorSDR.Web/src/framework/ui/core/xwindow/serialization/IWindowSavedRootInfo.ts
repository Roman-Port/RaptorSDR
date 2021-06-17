export default interface IWindowSavedRootInfo {

    initializedViews: string[]; //views that have already added their defaults into the layout
    version: number; //version number this was saved at
    data: any;

}