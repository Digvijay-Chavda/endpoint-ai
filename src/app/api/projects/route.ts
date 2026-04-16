import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateProjectInput } from '@/types';

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        endpoints: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateProjectInput = await request.json();
    
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create project', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
