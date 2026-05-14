import { NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file explicitly provided' }, { status: 400 });
    }



    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads');

    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // ignore if folder already exists
    }

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    return NextResponse.json({ success: true, url: `/uploads/${fileName}` });
  } catch (error) {
    console.error('Error in file upload:', error);
    return NextResponse.json({ success: false, message: 'File upload failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const urlParam = searchParams.get('url');

    if (!urlParam) {
      return NextResponse.json({ success: false, message: 'Invalid file URL' }, { status: 400 });
    }

    if (!urlParam.startsWith('/uploads/')) {
      return NextResponse.json({ success: false, message: 'Invalid file URL' }, { status: 400 });
    }



    const fileName = urlParam.replace('/uploads/', '');
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, fileName);

    try {
      await unlink(filePath);
    } catch (e) {
      console.error('File unlink error (might not exist):', e);
    }

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ success: false, message: 'File deletion failed' }, { status: 500 });
  }
}
