export default interface RaptorDomBuilder extends HTMLElement {

    SetStyleAttribute(key: string, value: string): RaptorDomBuilder;
    Chain(callback: (node: RaptorDomBuilder) => void): RaptorDomBuilder;

}