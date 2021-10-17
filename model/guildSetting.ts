import { Optional } from 'sequelize'
import {
  AutoIncrement,
  Column,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

export interface GuildSettingModelAttributes {
  _id: number
  guildId: string
  volume: number
  name: boolean
  speakerId: number
}

export interface GuildSettingCreationAttributes
  extends Optional<
    Omit<GuildSettingModelAttributes, '_id'>,
    'volume' | 'name' | 'speakerId'
  > {}

@Table({
  tableName: 'guild_setting',
  freezeTableName: true,
  underscored: true,
  timestamps: false,
})
class GuildSetting extends Model<
  GuildSettingModelAttributes,
  GuildSettingCreationAttributes
> {
  @AutoIncrement
  @PrimaryKey
  @Column({ type: DataType.INTEGER, field: '_id' })
  _id!: number

  @Column(DataType.TEXT)
  guildId!: string

  @Default(0.5)
  @Column(DataType.FLOAT)
  volume!: number

  @Default(true)
  @Column(DataType.BOOLEAN)
  name!: boolean

  @Default(0)
  @Column(DataType.INTEGER)
  speakerId!: number
}

export default GuildSetting
