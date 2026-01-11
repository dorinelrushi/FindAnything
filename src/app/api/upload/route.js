import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Image = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64Image}`;

        return NextResponse.json({ url: dataUrl }, { status: 200 });

    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
