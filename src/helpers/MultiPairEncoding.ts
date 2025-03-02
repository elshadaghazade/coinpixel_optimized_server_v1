class MultiPairEncoding {
    private static primes: number[] = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53];

    // Decode a single number back into multiple (row, col) pairs
    static decode(encodedNumber: bigint): [number, number][] {
        let number = encodedNumber;
        const pairs: [number, number][] = [];

        for (let i = 0; i < this.primes.length / 2; i++) {
            const rowPrime = BigInt(this.primes[i * 2] ?? 2);
            const colPrime = BigInt(this.primes[i * 2 + 1] ?? 3);

            let row = 0;
            while (number % rowPrime === BigInt(0)) {
                number /= rowPrime;
                row++;
            }

            let col = 0;
            while (number % colPrime === BigInt(0)) {
                number /= colPrime;
                col++;
            }

            if (row > 0 || col > 0) {
                pairs.push([row, col]);
            }
        }

        return pairs;
    }
}

export default MultiPairEncoding;