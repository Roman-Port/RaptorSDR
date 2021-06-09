import RaptorSize from "../RaptorSize";

export default interface IRaptorWindow {

    GetWindowName(): string;
    GetIsHeaderless(): boolean;
    GetMinSize(): RaptorSize;
    GetMaxSize(): RaptorSize;

    CreateWindow(window: HTMLElement): void;
    DestoryWindow(): void;

}