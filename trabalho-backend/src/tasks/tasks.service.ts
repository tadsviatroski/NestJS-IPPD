import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './entities/task.entity';

@Injectable()
export class TasksService {
  private readonly filePath = path.resolve(process.cwd(), 'data/tasks.json');

  private async ensureFileExists(): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      if (!content.trim()) {
        await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
      }
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        await fs.writeFile(this.filePath, JSON.stringify([], null, 2));
      } else {
        throw err;
      }
    }
  }

  private async readData(): Promise<Task[]> {
    await this.ensureFileExists();
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return data.trim() ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async writeData(data: Task[]): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const tasks = await this.readData();
    const newTask: Task = {
      id: Date.now(),
      titulo: createTaskDto.titulo,
      descricao: createTaskDto.descricao ?? '',
      concluida: createTaskDto.concluida ?? false,
    };
    tasks.push(newTask);
    await this.writeData(tasks);
    return newTask;
  }

  async findAll(): Promise<Task[]> {
    return await this.readData();
  }

  async findOne(id: number): Promise<Task> {
    const tasks = await this.readData();
    const task = tasks.find((t) => t.id === id);
    if (!task) {
      throw new NotFoundException(`Tarefa com ID ${id} não encontrada`);
    }
    return task;
  }

  // PUT - Substituição total
  async update(id: number, updateTaskDto: CreateTaskDto): Promise<Task> {
    const tasks = await this.readData();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new NotFoundException(`Tarefa com ID ${id} não encontrada`);
    }
    const updatedTask: Task = {
      id,
      titulo: updateTaskDto.titulo,
      descricao: updateTaskDto.descricao ?? '',
      concluida: updateTaskDto.concluida ?? false,
    };
    tasks[index] = updatedTask;
    await this.writeData(tasks);
    return updatedTask;
  }

  // PATCH - Atualização parcial
  async patch(id: number, patchTaskDto: UpdateTaskDto): Promise<Task> {
    const tasks = await this.readData();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new NotFoundException(`Tarefa com ID ${id} não encontrada`);
    }
    const patchedTask: Task = {
      ...tasks[index],
      ...patchTaskDto,
      id,
    };
    tasks[index] = patchedTask;
    await this.writeData(tasks);
    return patchedTask;
  }

  async remove(id: number): Promise<{ message: string }> {
    const tasks = await this.readData();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new NotFoundException(`Tarefa com ID ${id} não encontrada`);
    }
    tasks.splice(index, 1);
    await this.writeData(tasks);
    return { message: `Tarefa com ID ${id} removida com sucesso` };
  }
}
