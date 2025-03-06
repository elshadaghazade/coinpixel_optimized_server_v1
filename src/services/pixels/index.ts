import { ObjectId } from "mongodb";
import { pixelLogsCollection, pixelsCollection, usersCollection } from "../../mongodb";
import { OffsetType, PixelType, server_socket_command_enum, SocketType } from "../../types";
import MultiPairEncoding from "../../helpers/MultiPairEncoding";

export const setPixelLog = async (clan_id: string, userAddress: `0x${string}`) => {
    const clanId = new ObjectId(clan_id);

    await pixelLogsCollection.insertOne({
        clan_id: clanId,
        userAddress,
        created_at: new Date()
    });
}

export const setPixel = async (pixel: PixelType, offset: OffsetType) => {
    pixel.row += offset.rowsCount;
    pixel.col += offset.colsCount;
    if (typeof pixel.date === 'string') {
        pixel.date = new Date(pixel.date);
    }

    const existingPixel = await pixelsCollection.findOne({ 
        row: pixel.row, 
        col: pixel.col,
    });

    let docId: ObjectId | null = null;

    if (!existingPixel) {
        const result = await pixelsCollection.insertOne({
            ...pixel,
            _id: undefined
        });

        docId = result.insertedId;
    } else {
        await pixelsCollection.updateOne(
            { _id: existingPixel._id },
            { $set: pixel }
        );

        docId = existingPixel._id;
    }

    if (docId) {
        const pixel = await pixelsCollection.findOne({ _id: docId });
        return pixel;
    }
}

export const removePixel = async ([address, row, col]: [string, number, number]) => {
    const result = await pixelsCollection.deleteOne({ 
        row, 
        col,
        address
    });

    return result.deletedCount > 0;
}

export const getAreaData = async (data: [[number, number], [number, number], string], socket: SocketType) => {
    const [ [offsetRows, offsetCols], [endpointRow, endpointCol], excludes ] = data;

    const STEP = 50;

    let excludeArray: [number, number][] = [];
    if (excludes.trim()) {
        excludeArray = MultiPairEncoding.decode(BigInt(excludes));
    }

    for(let row = offsetRows; row < offsetRows + endpointRow; row += STEP) {
        for(let col = offsetCols; col < offsetCols + endpointCol; col += STEP) {
            const query: any = {
                $and: [
                    { row: { $gte: row, $lt: row + STEP } },
                    { col: { $gte: col, $lt: col + STEP } }
                ],
                // $expr: {
                //     $and: [
                //         { $ne: [{ $mod: ["$row", 3] }, 0] }, // Select every `skipEach` row
                //         { $ne: [{ $mod: ["$col", 3] }, 0] }  // Select every `skipEach` column
                //     ]
                // }
            };
        
            const excludes: {
                row: number;
                col: number;
            }[] = [];

            if (excludeArray.length) {
                for(let i = 0; i < excludeArray.length; i++) {
                    const exclude = excludeArray[i]!;

                    if (
                        exclude[0] >= row && exclude[0] <= row + STEP &&
                        exclude[1] >= col && exclude[1] <= col + STEP
                    ) {
                        excludes.push({
                            row: exclude[0],
                            col: exclude[1]
                        });

                        excludeArray.splice(i, 1);
                    }
                }

                if (excludes.length) {
                    query['$nor'] = excludes;
                }
            }
        
            const result = await pixelsCollection.find<PixelType>(query).toArray();
            const arr: string[] = [];
            if (result.length) {
                for(let i = 0; i < result.length; i++) {
                    const cell = result[i];

                    if (!cell) {
                        continue;
                    }
        
        
                    const cellData = `${cell._id}:${cell.row}:${cell.col}:${cell.color}:${cell.address}:${cell.date?.toString()}`;
                    arr.push(cellData);
                }
            }
        
            if (arr.length) {
                const payload = arr.join('|');
                console.log('string size', payload.length / 1024, 'kb');
                socket.emit(server_socket_command_enum.server_area_data, payload);
                if (global.gc) {
                    global.gc();
                }
            }
        }
    }
};

export const updatePixelLimit = async (pixelLimit: number, address: `0x${string}`) => {
    await usersCollection.updateOne(
        { address }, 
        { $set: { pixelLimit } }
    );
}