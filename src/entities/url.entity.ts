import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./users.entity";

@Entity('url')
export class Url {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 6, unique: true })
    shortCode: string;

    @Column()
    originalUrl: string;

    @Column({ default: 0 })
    accessCount: number;

    @ManyToOne(() => User, user => user.urls)
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
