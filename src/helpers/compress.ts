import { ObjectId } from "mongodb";
import { PixelType } from "../types";

export const encodeCell = (cell: PixelType): string => {
    // Convert _id to Buffer (12 bytes)
    const idBuffer = Buffer.from(new ObjectId(cell._id).id);

    // Convert Address (variable length)
    const addressStr = cell.address ?? ''; // Ensure address is a string
    const addressBuffer = Buffer.from(addressStr, "utf-8");
    const addressLengthBuffer = Buffer.alloc(1); // 1 byte to store address length
    addressLengthBuffer.writeUInt8(addressBuffer.length, 0);

    // Convert row & col (4 bytes each, UInt32)
    const rowBuffer = Buffer.alloc(4);
    rowBuffer.writeUInt32LE(cell.row, 0);

    const colBuffer = Buffer.alloc(4);
    colBuffer.writeUInt32LE(cell.col, 0);

    // Convert Hex Color (#ff0000) to Buffer (UTF-8)
    const colorStr = cell.color ?? ''; // Ensure it's a string
    const colorBuffer = Buffer.from(colorStr, "utf-8");

    // Convert Date to UTF-8 string
    const dateStr = cell.date ? cell.date.toString() : ''; // Retains timezone info
    const dateBuffer = Buffer.from(dateStr, "utf-8");

    // Separators to mark variable-length fields
    const separator = Buffer.from("\x00"); // Null byte separator

    // Combine all buffers
    const finalBuffer = Buffer.concat([
        idBuffer, addressLengthBuffer, addressBuffer, rowBuffer, colBuffer, 
        separator, colorBuffer, separator, dateBuffer
    ]);

    // Convert to Base64 for transmission
    return finalBuffer.toString("base64");
};