import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始导入种子数据...')

  // 清空现有数据
  await prisma.orderItem.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.category.deleteMany()

  // 创建分类
  const categories = [
    { name: '中国国旅', order: 0 },
    { name: '康辉旅游', order: 1 },
    { name: '中旅国际', order: 2 },
    { name: '凯撒旅游', order: 3 },
    { name: '私营业主', order: 4 }
  ]

  const createdCategories = await Promise.all(
    categories.map(cat =>
      prisma.category.create({
        data: cat
      })
    )
  )

  console.log(`已创建 ${createdCategories.length} 个分类`)

  // 创建客户和交易数据
  const customersData = [
    {
      categoryName: '中国国旅',
      name: '汤奇',
      source: '上海国旅总社',
      invoiceCompany: '上海国旅总社',
      comment: '138****8888 | VIP客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 8640.00,
          profit: 864.00,
          isPaid: false,
          comment: '核对中',
          orderItems: [
            {
              type: 'flight',
              route: '北京-东京往返',
              ticketNumber: 'TR-20231025-01',
              amount: 8640.00,
              date: '2023-10-25',
              comment: '含税机票'
            }
          ]
        }
      ]
    },
    {
      categoryName: '康辉旅游',
      name: '李春林',
      source: '康辉旅游分部',
      invoiceCompany: '康辉旅游分部',
      comment: '159****2233 | 普通客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 4200.00,
          profit: 420.00,
          isPaid: false,
          comment: '待结',
          orderItems: [
            {
              type: 'other',
              route: '泰国普吉岛',
              ticketNumber: 'TR-20231024-11',
              amount: 4200.00,
              date: '2023-10-24',
              comment: '团费'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中旅国际',
      name: '张美玲',
      source: '独立领队',
      invoiceCompany: null,
      comment: '131****0099 | VIP客户',
      transactions: []
    },
    {
      categoryName: '中国国旅',
      name: '汤小圆',
      source: '上海国旅总社',
      invoiceCompany: '上海国旅总社',
      comment: '138****5555 | VIP客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 13040.00,
          profit: 1304.00,
          isPaid: false,
          comment: '部分核对',
          orderItems: [
            {
              type: 'flight',
              route: '北京往返巴黎',
              ticketNumber: 'TR-20231025-01',
              amount: 8640.00,
              date: '2023-10-25',
              comment: '含税机票'
            },
            {
              type: 'hotel',
              route: '普吉岛5天4晚',
              ticketNumber: 'TR-20231018-05',
              amount: 4200.00,
              date: '2023-10-18',
              comment: '自由行套餐'
            }
          ]
        }
      ]
    },
    {
      categoryName: '私营业主',
      name: '汤圆圆',
      source: '私营业主',
      invoiceCompany: null,
      comment: '139****1234 | 普通客户',
      transactions: []
    }
  ]

  for (const customerData of customersData) {
    const category = createdCategories.find(c => c.name === customerData.categoryName)
    if (!category) continue

    const customer = await prisma.customer.create({
      data: {
        categoryId: category.id,
        name: customerData.name,
        source: customerData.source,
        invoiceCompany: customerData.invoiceCompany,
        comment: customerData.comment
      }
    })

    console.log(`已创建客户: ${customer.name}`)

    // 创建交易和订单项
    for (const transactionData of customerData.transactions) {
      const transaction = await prisma.transaction.create({
        data: {
          customerId: customer.id,
          month: transactionData.month,
          totalAmount: transactionData.totalAmount,
          profit: transactionData.profit,
          isPaid: transactionData.isPaid,
          comment: transactionData.comment
        }
      })

      for (const orderItemData of transactionData.orderItems) {
        await prisma.orderItem.create({
          data: {
            transactionId: transaction.id,
            type: orderItemData.type,
            route: orderItemData.route,
            ticketNumber: orderItemData.ticketNumber,
            amount: orderItemData.amount,
            date: orderItemData.date,
            comment: orderItemData.comment
          }
        })
      }

      console.log(`  已创建交易: ${transaction.month} - ¥${transaction.totalAmount}`)
    }
  }

  console.log('种子数据导入完成！')
}

main()
  .catch((e) => {
    console.error('导入种子数据时出错:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
