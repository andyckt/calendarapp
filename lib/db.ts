import { PrismaClient } from './generated/prisma'

// Add logging in development environment
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

// Use a global variable to prevent multiple instances during hot reloading
const prisma = globalThis.prisma ?? prismaClientSingleton()

// Only assign to global object in development to prevent memory leaks in production
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

export { prisma } 