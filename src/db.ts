import { Sequelize } from 'sequelize-typescript'

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'bot_db.sqlite',
  models: [__dirname + '/../model/*.ts'],
})

export default sequelize
