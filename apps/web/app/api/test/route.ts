import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import * as fs from 'fs';

export async function GET() {
  try {
    // Check if API dist exists
    const apiExists = fs.existsSync('/app/apps/api/dist/index.js');
    const localApiExists = fs.existsSync('./apps/api/dist/index.js');
    
    // Try to list the directory
    let dirContents = '';
    try {
      dirContents = execSync('ls -la apps/api/ 2>&1 || echo "DIR_NOT_FOUND"').toString();
    } catch (e) {
      dirContents = 'Error: ' + (e as Error).message;
    }
    
    // Check if API process is running
    let apiProcess = '';
    try {
      apiProcess = execSync('ps aux | grep node | grep -v grep 2>&1 || echo "NO_PROCESS"').toString();
    } catch (e) {
      apiProcess = 'Error: ' + (e as Error).message;
    }
    
    return NextResponse.json({
      apiExists,
      localApiExists,
      dirContents,
      apiProcess,
      cwd: process.cwd(),
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
