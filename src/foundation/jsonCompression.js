import jsonpack from "jsonpack";

export async function compress(data) {
    if (!data) return null;

    //This is silly, but is optimised by the interpreter
    data = JSON.parse(JSON.stringify(data));

    //Start with jsonpack, then use gzip to further compress to a uint8array
    const jsonPack = jsonpack.pack(data);
    const compressedStream = new Blob([jsonPack])
        .stream()
        .pipeThrough(new CompressionStream("gzip"));
    const response = await new Response(compressedStream).bytes();
    return response.toBase64();
}

export async function uncompress(compressedData) {
    if (!compressedData) return null;
    const uintData = Uint8Array.fromBase64(compressedData);
    //Reverse of compress
    const decompressedStream = new Blob([uintData])
        .stream()
        .pipeThrough(new DecompressionStream("gzip"));
    const response = await new Response(decompressedStream).text();
    const unpacked = jsonpack.unpack(response);
    return unpacked;
}