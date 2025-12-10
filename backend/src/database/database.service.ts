import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Client } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: Client;
  private isConnected = false;

  async onModuleInit() {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.warn('⚠️  DATABASE_URL not set, database features will be disabled');
      return;
    }

    try {
      this.client = new Client({
        connectionString: connectionString,
        ssl: process.env.NODE_ENV === 'production' 
          ? { rejectUnauthorized: false }
          : false,
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client && this.isConnected) {
      await this.client.end();
      console.log('👋 Database connection closed');
    }
  }

  async query(text: string, params?: any[]) {
    if (!this.isConnected) {
      throw new Error('Database is not connected');
    }

    try {
      return await this.client.query(text, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  getClient() {
    if (!this.isConnected) {
      throw new Error('Database is not connected');
    }
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}
