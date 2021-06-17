import RaptorWindowWrapper from "../RaptorWindowWrapper";
import WindowDropZone from "../WindowDropZone";

export default interface IWindowDropZoneElement extends HTMLElement {

    xraptor_dropzone_dropped?: (window: RaptorWindowWrapper) => void;

}