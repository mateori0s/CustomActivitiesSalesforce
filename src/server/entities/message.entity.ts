import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column()
  bill_number: string;

  @Column()
  source: string;

  @Column()
  created_at: Date;

  @Column()
  updated_at: Date;

  @Column()
  deleted_at: Date;
}
