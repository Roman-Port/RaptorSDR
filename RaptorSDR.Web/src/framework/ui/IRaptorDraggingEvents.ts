export default interface IRaptorDraggingEvents {

    DragBegin?: (evt: MouseEvent, target: HTMLElement) => void;
    DragMove?: (evt: MouseEvent, target: HTMLElement) => void;
    DragEnd?: (evt: MouseEvent, target: HTMLElement) => void;

}