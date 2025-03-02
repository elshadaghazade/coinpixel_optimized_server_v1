import { db } from '../mongodb';
import { PixelType } from '../types';

const colors = [
    '#5432f5',
    '#000000',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    "#134567",
];

async function main () {
    await db.collection('pixels').deleteMany({});
    const address = 'abc';
    let pixels: Omit<PixelType, '_id'>[] = [];

    for(let row = 0; row < 1000; row += 1) {
        for(let col = 0; col < 1000; col += 1) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const pixel = {
                row,
                col,
                address,
                color,
                date: new Date()
            };

            pixels.push(pixel);

            if (pixels.length >= 10000) {
                await db.collection('pixels').insertMany(Array.from(pixels.values()));
                pixels = [];
                console.log("row:", row, "col:", col);
            }
        }
    }
    console.log("Done");
}

main();