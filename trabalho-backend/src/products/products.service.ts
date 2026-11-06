import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  private readonly filePath = path.resolve(process.cwd(), 'data/products.json');

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

  private async readData(): Promise<Product[]> {
    await this.ensureFileExists();
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return data.trim() ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async writeData(data: Product[]): Promise<void> {
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const products = await this.readData();
    const newProduct: Product = {
      id: Date.now(),
      nome: createProductDto.nome,
      descricao: createProductDto.descricao,
      preco: createProductDto.preco,
      estoque: createProductDto.estoque ?? 0,
    };
    products.push(newProduct);
    await this.writeData(products);
    return newProduct;
  }

  async findAll(): Promise<Product[]> {
    return await this.readData();
  }

  async findOne(id: number): Promise<Product> {
    const products = await this.readData();
    const product = products.find((p) => p.id === id);
    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }
    return product;
  }

  // PUT - Substituição total
  async update(id: number, updateProductDto: CreateProductDto): Promise<Product> {
    const products = await this.readData();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }
    const updatedProduct: Product = {
      id,
      nome: updateProductDto.nome,
      descricao: updateProductDto.descricao,
      preco: updateProductDto.preco,
      estoque: updateProductDto.estoque ?? 0,
    };
    products[index] = updatedProduct;
    await this.writeData(products);
    return updatedProduct;
  }

  // PATCH - Atualização parcial
  async patch(id: number, patchProductDto: UpdateProductDto): Promise<Product> {
    const products = await this.readData();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }
    const patchedProduct: Product = {
      ...products[index],
      ...patchProductDto,
      id,
    };
    products[index] = patchedProduct;
    await this.writeData(products);
    return patchedProduct;
  }

  async remove(id: number): Promise<{ message: string }> {
    const products = await this.readData();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }
    products.splice(index, 1);
    await this.writeData(products);
    return { message: `Produto com ID ${id} removido com sucesso` };
  }
}
