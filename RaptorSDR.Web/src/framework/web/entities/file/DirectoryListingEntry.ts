import { DirectoryListingEntryType } from "./DirectoryListingEntryType";

export default class DirectoryListingEntry {

    name: string;
    type: DirectoryListingEntryType;
    date: Date;
    size: number;

    fullName: string;

}