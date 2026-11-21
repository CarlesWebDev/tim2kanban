import { Column,Task } from '@/types/kanban';

export const columns: Column[] = [
    {id: 'todo', title:'To Do'},
    {id: 'in-progress', title:'In Progress'},
    {id: 'done', title:'Done'}
]

export const tasks: Task[] = [
    {
        id: '1',
        title: 'Task 1',
        description: 'Ini adalah task 1',
        status: 'todo',
        createdAt: new Date('2024-06-01T10:00:00Z'),
        updatedAt: new Date('2024-06-01T10:00:00Z'),
    },
    {
        id: '2',
        title: 'Task 2',
        description: 'Ini adalah task 2',
        status: 'in-progress',
        createdAt: new Date('2024-06-01T10:00:00Z'),
        updatedAt: new Date('2024-06-01T10:00:00Z'),
    },
    {
        id: '3',
        title: 'Task 3',
        description: 'Ini adalah task 3',
        status: 'done',
        createdAt: new Date('2024-06-01T10:00:00Z'),
        updatedAt: new Date('2024-06-01T10:00:00Z'),
    }
];