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
    // 中国国旅 (10 customers)
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
      categoryName: '中国国旅',
      name: '王建国',
      source: '北京国旅',
      invoiceCompany: '北京国旅有限公司',
      comment: '137****6789 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 15680.00,
          profit: 1568.00,
          isPaid: true,
          comment: '已结清',
          orderItems: [
            {
              type: 'flight',
              route: '上海-洛杉矶往返',
              ticketNumber: 'TR-20231101-12',
              amount: 12000.00,
              date: '2023-11-01',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '洛杉矶7晚酒店',
              ticketNumber: 'TR-20231101-13',
              amount: 3680.00,
              date: '2023-11-01',
              comment: '五星酒店'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中国国旅',
      name: '陈晓红',
      source: '上海国旅总社',
      invoiceCompany: '上海国旅总社',
      comment: '139****2345 | 普通客户',
      transactions: [
        {
          month: '2023-09',
          totalAmount: 6800.00,
          profit: 680.00,
          isPaid: true,
          comment: '已付清',
          orderItems: [
            {
              type: 'flight',
              route: '广州-新加坡往返',
              ticketNumber: 'TR-20230915-08',
              amount: 4500.00,
              date: '2023-09-15',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '新加坡4晚住宿',
              ticketNumber: 'TR-20230915-09',
              amount: 2300.00,
              date: '2023-09-15',
              comment: '四星酒店'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中国国旅',
      name: '刘明华',
      source: '深圳国旅',
      invoiceCompany: '深圳国旅有限公司',
      comment: '188****7654 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 22400.00,
          profit: 2240.00,
          isPaid: false,
          comment: '待核对',
          orderItems: [
            {
              type: 'flight',
              route: '北京-伦敦往返',
              ticketNumber: 'TR-20231110-20',
              amount: 14800.00,
              date: '2023-11-10',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '伦敦10晚住宿',
              ticketNumber: 'TR-20231110-21',
              amount: 7600.00,
              date: '2023-11-10',
              comment: '五星豪华酒店'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中国国旅',
      name: '张伟',
      source: '上海国旅总社',
      invoiceCompany: '上海国旅总社',
      comment: '136****8901 | 普通客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 5200.00,
          profit: 520.00,
          isPaid: false,
          comment: '待付款',
          orderItems: [
            {
              type: 'other',
              route: '云南丽江5天团',
              ticketNumber: 'TR-20231020-15',
              amount: 5200.00,
              date: '2023-10-20',
              comment: '跟团游'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中国国旅',
      name: '李娜',
      source: '上海国旅总社',
      invoiceCompany: '上海国旅总社',
      comment: '159****3456 | VIP客户',
      transactions: [
        {
          month: '2023-09',
          totalAmount: 9800.00,
          profit: 980.00,
          isPaid: true,
          comment: '已结算',
          orderItems: [
            {
              type: 'flight',
              route: '上海-首尔往返',
              ticketNumber: 'TR-20230905-03',
              amount: 3800.00,
              date: '2023-09-05',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '首尔6晚住宿',
              ticketNumber: 'TR-20230905-04',
              amount: 6000.00,
              date: '2023-09-05',
              comment: '明洞商圈酒店'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中国国旅',
      name: '赵强',
      source: '北京国旅',
      invoiceCompany: '北京国旅有限公司',
      comment: '158****2222 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 18900.00,
          profit: 1890.00,
          isPaid: false,
          comment: '核对中',
          orderItems: [
            {
              type: 'flight',
              route: '北京-悉尼往返',
              ticketNumber: 'TR-20231115-25',
              amount: 13500.00,
              date: '2023-11-15',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '悉尼8晚住宿',
              ticketNumber: 'TR-20231115-26',
              amount: 5400.00,
              date: '2023-11-15',
              comment: '海景酒店'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中国国旅',
      name: '周敏',
      source: '上海国旅总社',
      invoiceCompany: '上海国旅总社',
      comment: '135****7890 | 普通客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 3800.00,
          profit: 380.00,
          isPaid: true,
          comment: '已付款',
          orderItems: [
            {
              type: 'flight',
              route: '杭州-成都往返',
              ticketNumber: 'TR-20231012-18',
              amount: 3800.00,
              date: '2023-10-12',
              comment: '经济舱'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中国国旅',
      name: '吴晓燕',
      source: '上海国旅总社',
      invoiceCompany: '上海国旅总社',
      comment: '187****4567 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 12600.00,
          profit: 1260.00,
          isPaid: false,
          comment: '待结算',
          orderItems: [
            {
              type: 'flight',
              route: '上海-曼谷往返',
              ticketNumber: 'TR-20231105-30',
              amount: 4800.00,
              date: '2023-11-05',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '曼谷7晚住宿',
              ticketNumber: 'TR-20231105-31',
              amount: 4200.00,
              date: '2023-11-05',
              comment: '市区四星酒店'
            },
            {
              type: 'other',
              route: '普吉岛一日游',
              ticketNumber: 'TR-20231105-32',
              amount: 3600.00,
              date: '2023-11-08',
              comment: '含接送'
            }
          ]
        }
      ]
    },

    // 康辉旅游 (10 customers)
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
      categoryName: '康辉旅游',
      name: '马云飞',
      source: '康辉总部',
      invoiceCompany: '北京康辉国际旅行社',
      comment: '186****5678 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 16800.00,
          profit: 1680.00,
          isPaid: true,
          comment: '已结清',
          orderItems: [
            {
              type: 'flight',
              route: '北京-巴黎往返',
              ticketNumber: 'KH-20231102-01',
              amount: 11200.00,
              date: '2023-11-02',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '巴黎8晚住宿',
              ticketNumber: 'KH-20231102-02',
              amount: 5600.00,
              date: '2023-11-02',
              comment: '塞纳河畔酒店'
            }
          ]
        }
      ]
    },
    {
      categoryName: '康辉旅游',
      name: '孙丽丽',
      source: '康辉旅游分部',
      invoiceCompany: '康辉旅游分部',
      comment: '138****9012 | 普通客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 7200.00,
          profit: 720.00,
          isPaid: false,
          comment: '核对中',
          orderItems: [
            {
              type: 'flight',
              route: '上海-台北往返',
              ticketNumber: 'KH-20231018-05',
              amount: 4500.00,
              date: '2023-10-18',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '台北5晚住宿',
              ticketNumber: 'KH-20231018-06',
              amount: 2700.00,
              date: '2023-10-18',
              comment: '西门町商圈'
            }
          ]
        }
      ]
    },
    {
      categoryName: '康辉旅游',
      name: '黄志强',
      source: '康辉广州分社',
      invoiceCompany: '广州康辉国际旅行社',
      comment: '137****3344 | VIP客户',
      transactions: [
        {
          month: '2023-09',
          totalAmount: 8900.00,
          profit: 890.00,
          isPaid: true,
          comment: '已付清',
          orderItems: [
            {
              type: 'flight',
              route: '广州-大阪往返',
              ticketNumber: 'KH-20230920-10',
              amount: 5600.00,
              date: '2023-09-20',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '大阪6晚住宿',
              ticketNumber: 'KH-20230920-11',
              amount: 3300.00,
              date: '2023-09-20',
              comment: '梅田商圈'
            }
          ]
        }
      ]
    },
    {
      categoryName: '康辉旅游',
      name: '杨文静',
      source: '康辉旅游分部',
      invoiceCompany: '康辉旅游分部',
      comment: '155****6677 | 普通客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 5600.00,
          profit: 560.00,
          isPaid: false,
          comment: '待付款',
          orderItems: [
            {
              type: 'other',
              route: '桂林山水5日游',
              ticketNumber: 'KH-20231108-15',
              amount: 5600.00,
              date: '2023-11-08',
              comment: '纯玩团'
            }
          ]
        }
      ]
    },
    {
      categoryName: '康辉旅游',
      name: '林浩然',
      source: '康辉总部',
      invoiceCompany: '北京康辉国际旅行社',
      comment: '189****8899 | VIP客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 19800.00,
          profit: 1980.00,
          isPaid: false,
          comment: '部分核对',
          orderItems: [
            {
              type: 'flight',
              route: '北京-纽约往返',
              ticketNumber: 'KH-20231025-20',
              amount: 15000.00,
              date: '2023-10-25',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '纽约7晚住宿',
              ticketNumber: 'KH-20231025-21',
              amount: 4800.00,
              date: '2023-10-25',
              comment: '曼哈顿中城'
            }
          ]
        }
      ]
    },
    {
      categoryName: '康辉旅游',
      name: '郑美玲',
      source: '康辉旅游分部',
      invoiceCompany: '康辉旅游分部',
      comment: '156****1122 | 普通客户',
      transactions: [
        {
          month: '2023-09',
          totalAmount: 4800.00,
          profit: 480.00,
          isPaid: true,
          comment: '已结算',
          orderItems: [
            {
              type: 'flight',
              route: '成都-厦门往返',
              ticketNumber: 'KH-20230912-08',
              amount: 2800.00,
              date: '2023-09-12',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '厦门5晚住宿',
              ticketNumber: 'KH-20230912-09',
              amount: 2000.00,
              date: '2023-09-12',
              comment: '鼓浪屿附近'
            }
          ]
        }
      ]
    },
    {
      categoryName: '康辉旅游',
      name: '何建军',
      source: '康辉上海分社',
      invoiceCompany: '上海康辉国际旅行社',
      comment: '188****5566 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 13500.00,
          profit: 1350.00,
          isPaid: false,
          comment: '核对中',
          orderItems: [
            {
              type: 'flight',
              route: '上海-伦敦往返',
              ticketNumber: 'KH-20231112-25',
              amount: 10800.00,
              date: '2023-11-12',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '伦敦6晚住宿',
              ticketNumber: 'KH-20231112-26',
              amount: 2700.00,
              date: '2023-11-12',
              comment: '市区酒店'
            }
          ]
        }
      ]
    },
    {
      categoryName: '康辉旅游',
      name: '谢晓峰',
      source: '康辉旅游分部',
      invoiceCompany: '康辉旅游分部',
      comment: '157****7788 | 普通客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 6400.00,
          profit: 640.00,
          isPaid: true,
          comment: '已付款',
          orderItems: [
            {
              type: 'other',
              route: '海南三亚6日游',
              ticketNumber: 'KH-20231015-30',
              amount: 6400.00,
              date: '2023-10-15',
              comment: '含机票酒店'
            }
          ]
        }
      ]
    },
    {
      categoryName: '康辉旅游',
      name: '罗莉',
      source: '康辉旅游分部',
      invoiceCompany: '康辉旅游分部',
      comment: '139****4455 | 普通客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 9200.00,
          profit: 920.00,
          isPaid: false,
          comment: '待结算',
          orderItems: [
            {
              type: 'flight',
              route: '北京-香港往返',
              ticketNumber: 'KH-20231120-35',
              amount: 5400.00,
              date: '2023-11-20',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '香港5晚住宿',
              ticketNumber: 'KH-20231120-36',
              amount: 3800.00,
              date: '2023-11-20',
              comment: '尖沙咀商圈'
            }
          ]
        }
      ]
    },

    // 中旅国际 (10 customers)
    {
      categoryName: '中旅国际',
      name: '张美玲',
      source: '独立领队',
      invoiceCompany: null,
      comment: '131****0099 | VIP客户',
      transactions: []
    },
    {
      categoryName: '中旅国际',
      name: '陈思远',
      source: '中旅总社',
      invoiceCompany: '中国旅行社总社有限公司',
      comment: '158****3344 | VIP客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 14200.00,
          profit: 1420.00,
          isPaid: false,
          comment: '待结算',
          orderItems: [
            {
              type: 'flight',
              route: '上海-罗马往返',
              ticketNumber: 'ZL-20231020-01',
              amount: 11000.00,
              date: '2023-10-20',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '罗马6晚住宿',
              ticketNumber: 'ZL-20231020-02',
              amount: 3200.00,
              date: '2023-10-20',
              comment: '罗马市中心'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中旅国际',
      name: '刘德华',
      source: '中旅北京分社',
      invoiceCompany: '北京中旅国际旅行社',
      comment: '136****5577 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 21600.00,
          profit: 2160.00,
          isPaid: true,
          comment: '已结清',
          orderItems: [
            {
              type: 'flight',
              route: '北京-迪拜往返',
              ticketNumber: 'ZL-20231105-05',
              amount: 13800.00,
              date: '2023-11-05',
              comment: '头等舱'
            },
            {
              type: 'hotel',
              route: '迪拜7晚住宿',
              ticketNumber: 'ZL-20231105-06',
              amount: 7800.00,
              date: '2023-11-05',
              comment: '七星帆船酒店'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中旅国际',
      name: '王菲菲',
      source: '独立领队',
      invoiceCompany: null,
      comment: '187****6688 | 普通客户',
      transactions: [
        {
          month: '2023-09',
          totalAmount: 5800.00,
          profit: 580.00,
          isPaid: true,
          comment: '已付清',
          orderItems: [
            {
              type: 'flight',
              route: '广州-吉隆坡往返',
              ticketNumber: 'ZL-20230918-10',
              amount: 3200.00,
              date: '2023-09-18',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '吉隆坡4晚住宿',
              ticketNumber: 'ZL-20230918-11',
              amount: 2600.00,
              date: '2023-09-18',
              comment: '双子塔附近'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中旅国际',
      name: '赵本山',
      source: '中旅总社',
      invoiceCompany: '中国旅行社总社有限公司',
      comment: '139****9900 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 17800.00,
          profit: 1780.00,
          isPaid: false,
          comment: '核对中',
          orderItems: [
            {
              type: 'flight',
              route: '北京-温哥华往返',
              ticketNumber: 'ZL-20231110-15',
              amount: 12600.00,
              date: '2023-11-10',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '温哥华8晚住宿',
              ticketNumber: 'ZL-20231110-16',
              amount: 5200.00,
              date: '2023-11-10',
              comment: '市中心酒店'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中旅国际',
      name: '宋佳',
      source: '中旅上海分社',
      invoiceCompany: '上海中旅国际旅行社',
      comment: '185****2233 | 普通客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 6900.00,
          profit: 690.00,
          isPaid: false,
          comment: '待付款',
          orderItems: [
            {
              type: 'flight',
              route: '上海-釜山往返',
              ticketNumber: 'ZL-20231012-20',
              amount: 3600.00,
              date: '2023-10-12',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '釜山5晚住宿',
              ticketNumber: 'ZL-20231012-21',
              amount: 3300.00,
              date: '2023-10-12',
              comment: '海云台海滩'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中旅国际',
      name: '冯小刚',
      source: '中旅总社',
      invoiceCompany: '中国旅行社总社有限公司',
      comment: '138****1122 | VIP客户',
      transactions: [
        {
          month: '2023-09',
          totalAmount: 19500.00,
          profit: 1950.00,
          isPaid: true,
          comment: '已结算',
          orderItems: [
            {
              type: 'flight',
              route: '北京-墨尔本往返',
              ticketNumber: 'ZL-20230925-25',
              amount: 14200.00,
              date: '2023-09-25',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '墨尔本9晚住宿',
              ticketNumber: 'ZL-20230925-26',
              amount: 5300.00,
              date: '2023-09-25',
              comment: '市中心五星'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中旅国际',
      name: '章子怡',
      source: '独立领队',
      invoiceCompany: null,
      comment: '186****5544 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 25800.00,
          profit: 2580.00,
          isPaid: false,
          comment: '待核对',
          orderItems: [
            {
              type: 'flight',
              route: '北京-洛杉矶往返',
              ticketNumber: 'ZL-20231118-30',
              amount: 18600.00,
              date: '2023-11-18',
              comment: '头等舱'
            },
            {
              type: 'hotel',
              route: '洛杉矶10晚住宿',
              ticketNumber: 'ZL-20231118-31',
              amount: 7200.00,
              date: '2023-11-18',
              comment: '比佛利山庄'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中旅国际',
      name: '葛优',
      source: '中旅北京分社',
      invoiceCompany: '北京中旅国际旅行社',
      comment: '137****7766 | 普通客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 8600.00,
          profit: 860.00,
          isPaid: true,
          comment: '已付款',
          orderItems: [
            {
              type: 'flight',
              route: '北京-清迈往返',
              ticketNumber: 'ZL-20231008-35',
              amount: 4800.00,
              date: '2023-10-08',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '清迈7晚住宿',
              ticketNumber: 'ZL-20231008-36',
              amount: 3800.00,
              date: '2023-10-08',
              comment: '古城区酒店'
            }
          ]
        }
      ]
    },
    {
      categoryName: '中旅国际',
      name: '徐峥',
      source: '中旅上海分社',
      invoiceCompany: '上海中旅国际旅行社',
      comment: '159****8877 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 15600.00,
          profit: 1560.00,
          isPaid: false,
          comment: '部分核对',
          orderItems: [
            {
              type: 'flight',
              route: '上海-阿姆斯特丹往返',
              ticketNumber: 'ZL-20231122-40',
              amount: 11400.00,
              date: '2023-11-22',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '阿姆斯特丹7晚住宿',
              ticketNumber: 'ZL-20231122-41',
              amount: 4200.00,
              date: '2023-11-22',
              comment: '运河区酒店'
            }
          ]
        }
      ]
    },

    // 凯撒旅游 (10 customers)
    {
      categoryName: '凯撒旅游',
      name: '邓超',
      source: '凯撒总部',
      invoiceCompany: '凯撒世嘉旅游有限公司',
      comment: '188****2211 | VIP客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 18900.00,
          profit: 1890.00,
          isPaid: false,
          comment: '待结算',
          orderItems: [
            {
              type: 'flight',
              route: '北京-巴塞罗那往返',
              ticketNumber: 'KS-20231015-01',
              amount: 13600.00,
              date: '2023-10-15',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '巴塞罗那8晚住宿',
              ticketNumber: 'KS-20231015-02',
              amount: 5300.00,
              date: '2023-10-15',
              comment: '圣家堂附近'
            }
          ]
        }
      ]
    },
    {
      categoryName: '凯撒旅游',
      name: '孙俪',
      source: '凯撒上海分社',
      invoiceCompany: '上海凯撒旅游有限公司',
      comment: '139****3355 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 22400.00,
          profit: 2240.00,
          isPaid: true,
          comment: '已结清',
          orderItems: [
            {
              type: 'flight',
              route: '上海-巴黎往返',
              ticketNumber: 'KS-20231108-05',
              amount: 14800.00,
              date: '2023-11-08',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '巴黎10晚住宿',
              ticketNumber: 'KS-20231108-06',
              amount: 7600.00,
              date: '2023-11-08',
              comment: '香榭丽舍大街'
            }
          ]
        }
      ]
    },
    {
      categoryName: '凯撒旅游',
      name: '黄渤',
      source: '凯撒总部',
      invoiceCompany: '凯撒世嘉旅游有限公司',
      comment: '157****6644 | VIP客户',
      transactions: [
        {
          month: '2023-09',
          totalAmount: 16200.00,
          profit: 1620.00,
          isPaid: true,
          comment: '已付清',
          orderItems: [
            {
              type: 'flight',
              route: '北京-旧金山往返',
              ticketNumber: 'KS-20230920-10',
              amount: 12800.00,
              date: '2023-09-20',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '旧金山6晚住宿',
              ticketNumber: 'KS-20230920-11',
              amount: 3400.00,
              date: '2023-09-20',
              comment: '渔人码头附近'
            }
          ]
        }
      ]
    },
    {
      categoryName: '凯撒旅游',
      name: '赵薇',
      source: '凯撒北京分社',
      invoiceCompany: '北京凯撒旅游有限公司',
      comment: '186****9988 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 27500.00,
          profit: 2750.00,
          isPaid: false,
          comment: '核对中',
          orderItems: [
            {
              type: 'flight',
              route: '北京-马尔代夫往返',
              ticketNumber: 'KS-20231112-15',
              amount: 15800.00,
              date: '2023-11-12',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '马尔代夫水上别墅10晚',
              ticketNumber: 'KS-20231112-16',
              amount: 11700.00,
              date: '2023-11-12',
              comment: '全包套餐'
            }
          ]
        }
      ]
    },
    {
      categoryName: '凯撒旅游',
      name: '范冰冰',
      source: '凯撒总部',
      invoiceCompany: '凯撒世嘉旅游有限公司',
      comment: '138****5522 | VIP客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 24600.00,
          profit: 2460.00,
          isPaid: false,
          comment: '待付款',
          orderItems: [
            {
              type: 'flight',
              route: '上海-苏黎世往返',
              ticketNumber: 'KS-20231025-20',
              amount: 16800.00,
              date: '2023-10-25',
              comment: '头等舱'
            },
            {
              type: 'hotel',
              route: '瑞士8晚住宿',
              ticketNumber: 'KS-20231025-21',
              amount: 7800.00,
              date: '2023-10-25',
              comment: '阿尔卑斯山度假村'
            }
          ]
        }
      ]
    },
    {
      categoryName: '凯撒旅游',
      name: '成龙',
      source: '凯撒VIP部',
      invoiceCompany: '凯撒世嘉旅游有限公司',
      comment: '189****7711 | VIP客户',
      transactions: [
        {
          month: '2023-09',
          totalAmount: 31200.00,
          profit: 3120.00,
          isPaid: true,
          comment: '已结算',
          orderItems: [
            {
              type: 'flight',
              route: '香港-伦敦往返',
              ticketNumber: 'KS-20230915-25',
              amount: 19800.00,
              date: '2023-09-15',
              comment: '头等舱'
            },
            {
              type: 'hotel',
              route: '伦敦12晚住宿',
              ticketNumber: 'KS-20230915-26',
              amount: 11400.00,
              date: '2023-09-15',
              comment: '白金汉宫附近'
            }
          ]
        }
      ]
    },
    {
      categoryName: '凯撒旅游',
      name: '周星驰',
      source: '凯撒香港分社',
      invoiceCompany: '香港凯撒旅游有限公司',
      comment: '137****8899 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 19800.00,
          profit: 1980.00,
          isPaid: false,
          comment: '部分核对',
          orderItems: [
            {
              type: 'flight',
              route: '香港-东京往返',
              ticketNumber: 'KS-20231120-30',
              amount: 8600.00,
              date: '2023-11-20',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '东京12晚住宿',
              ticketNumber: 'KS-20231120-31',
              amount: 11200.00,
              date: '2023-11-20',
              comment: '新宿区五星'
            }
          ]
        }
      ]
    },
    {
      categoryName: '凯撒旅游',
      name: '刘德华',
      source: '凯撒总部',
      invoiceCompany: '凯撒世嘉旅游有限公司',
      comment: '158****4433 | VIP客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 28900.00,
          profit: 2890.00,
          isPaid: true,
          comment: '已付款',
          orderItems: [
            {
              type: 'flight',
              route: '北京-悉尼往返',
              ticketNumber: 'KS-20231018-35',
              amount: 18600.00,
              date: '2023-10-18',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '悉尼14晚住宿',
              ticketNumber: 'KS-20231018-36',
              amount: 10300.00,
              date: '2023-10-18',
              comment: '悉尼歌剧院景观'
            }
          ]
        }
      ]
    },
    {
      categoryName: '凯撒旅游',
      name: '张学友',
      source: '凯撒香港分社',
      invoiceCompany: '香港凯撒旅游有限公司',
      comment: '187****2244 | VIP客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 21600.00,
          profit: 2160.00,
          isPaid: false,
          comment: '待结算',
          orderItems: [
            {
              type: 'flight',
              route: '香港-罗马往返',
              ticketNumber: 'KS-20231125-40',
              amount: 15200.00,
              date: '2023-11-25',
              comment: '商务舱'
            },
            {
              type: 'hotel',
              route: '罗马9晚住宿',
              ticketNumber: 'KS-20231125-41',
              amount: 6400.00,
              date: '2023-11-25',
              comment: '梵蒂冈附近'
            }
          ]
        }
      ]
    },
    {
      categoryName: '凯撒旅游',
      name: '郭富城',
      source: '凯撒总部',
      invoiceCompany: '凯撒世嘉旅游有限公司',
      comment: '136****6655 | VIP客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 25800.00,
          profit: 2580.00,
          isPaid: false,
          comment: '核对中',
          orderItems: [
            {
              type: 'flight',
              route: '北京-迪拜往返',
              ticketNumber: 'KS-20231028-45',
              amount: 17400.00,
              date: '2023-10-28',
              comment: '头等舱'
            },
            {
              type: 'hotel',
              route: '迪拜10晚住宿',
              ticketNumber: 'KS-20231028-46',
              amount: 8400.00,
              date: '2023-10-28',
              comment: '棕榈岛亚特兰蒂斯'
            }
          ]
        }
      ]
    },

    // 私营业主 (10 customers)
    {
      categoryName: '私营业主',
      name: '汤圆圆',
      source: '私营业主',
      invoiceCompany: null,
      comment: '139****1234 | 普通客户',
      transactions: []
    },
    {
      categoryName: '私营业主',
      name: '王小明',
      source: '自由行客户',
      invoiceCompany: null,
      comment: '138****9876 | 普通客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 5600.00,
          profit: 560.00,
          isPaid: false,
          comment: '待付款',
          orderItems: [
            {
              type: 'flight',
              route: '北京-三亚往返',
              ticketNumber: 'PY-20231020-01',
              amount: 3600.00,
              date: '2023-10-20',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '三亚5晚住宿',
              ticketNumber: 'PY-20231020-02',
              amount: 2000.00,
              date: '2023-10-20',
              comment: '亚龙湾酒店'
            }
          ]
        }
      ]
    },
    {
      categoryName: '私营业主',
      name: '李晓华',
      source: '个人客户',
      invoiceCompany: null,
      comment: '156****5432 | 普通客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 8400.00,
          profit: 840.00,
          isPaid: true,
          comment: '已付清',
          orderItems: [
            {
              type: 'flight',
              route: '上海-巴厘岛往返',
              ticketNumber: 'PY-20231105-05',
              amount: 5200.00,
              date: '2023-11-05',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '巴厘岛6晚住宿',
              ticketNumber: 'PY-20231105-06',
              amount: 3200.00,
              date: '2023-11-05',
              comment: '海边度假村'
            }
          ]
        }
      ]
    },
    {
      categoryName: '私营业主',
      name: '陈建国',
      source: '朋友介绍',
      invoiceCompany: null,
      comment: '188****7654 | 普通客户',
      transactions: [
        {
          month: '2023-09',
          totalAmount: 6800.00,
          profit: 680.00,
          isPaid: true,
          comment: '已结算',
          orderItems: [
            {
              type: 'other',
              route: '新疆喀纳斯7日游',
              ticketNumber: 'PY-20230918-10',
              amount: 6800.00,
              date: '2023-09-18',
              comment: '纯玩小团'
            }
          ]
        }
      ]
    },
    {
      categoryName: '私营业主',
      name: '赵丽娜',
      source: '个人客户',
      invoiceCompany: null,
      comment: '137****3210 | 普通客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 4200.00,
          profit: 420.00,
          isPaid: false,
          comment: '待结',
          orderItems: [
            {
              type: 'flight',
              route: '深圳-曼谷往返',
              ticketNumber: 'PY-20231012-15',
              amount: 2800.00,
              date: '2023-10-12',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '曼谷4晚住宿',
              ticketNumber: 'PY-20231012-16',
              amount: 1400.00,
              date: '2023-10-12',
              comment: '素坤逸区'
            }
          ]
        }
      ]
    },
    {
      categoryName: '私营业主',
      name: '张军',
      source: '自由行客户',
      invoiceCompany: null,
      comment: '159****6543 | 普通客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 9600.00,
          profit: 960.00,
          isPaid: false,
          comment: '核对中',
          orderItems: [
            {
              type: 'flight',
              route: '北京-大阪往返',
              ticketNumber: 'PY-20231110-20',
              amount: 5800.00,
              date: '2023-11-10',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '大阪7晚住宿',
              ticketNumber: 'PY-20231110-21',
              amount: 3800.00,
              date: '2023-11-10',
              comment: '心斋桥商圈'
            }
          ]
        }
      ]
    },
    {
      categoryName: '私营业主',
      name: '刘芳',
      source: '朋友介绍',
      invoiceCompany: null,
      comment: '186****4321 | 普通客户',
      transactions: [
        {
          month: '2023-09',
          totalAmount: 7200.00,
          profit: 720.00,
          isPaid: true,
          comment: '已付款',
          orderItems: [
            {
              type: 'flight',
              route: '成都-西双版纳往返',
              ticketNumber: 'PY-20230925-25',
              amount: 2400.00,
              date: '2023-09-25',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '西双版纳6晚住宿',
              ticketNumber: 'PY-20230925-26',
              amount: 4800.00,
              date: '2023-09-25',
              comment: '热带雨林度假村'
            }
          ]
        }
      ]
    },
    {
      categoryName: '私营业主',
      name: '周雷',
      source: '个人客户',
      invoiceCompany: null,
      comment: '158****8765 | 普通客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 5400.00,
          profit: 540.00,
          isPaid: false,
          comment: '待结算',
          orderItems: [
            {
              type: 'other',
              route: '张家界5日游',
              ticketNumber: 'PY-20231115-30',
              amount: 5400.00,
              date: '2023-11-15',
              comment: '含门票住宿'
            }
          ]
        }
      ]
    },
    {
      categoryName: '私营业主',
      name: '吴霞',
      source: '自由行客户',
      invoiceCompany: null,
      comment: '135****2109 | 普通客户',
      transactions: [
        {
          month: '2023-10',
          totalAmount: 11200.00,
          profit: 1120.00,
          isPaid: true,
          comment: '已结清',
          orderItems: [
            {
              type: 'flight',
              route: '上海-普吉岛往返',
              ticketNumber: 'PY-20231018-35',
              amount: 4800.00,
              date: '2023-10-18',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '普吉岛8晚住宿',
              ticketNumber: 'PY-20231018-36',
              amount: 6400.00,
              date: '2023-10-18',
              comment: '海边五星酒店'
            }
          ]
        }
      ]
    },
    {
      categoryName: '私营业主',
      name: '郑峰',
      source: '朋友介绍',
      invoiceCompany: null,
      comment: '189****5432 | 普通客户',
      transactions: [
        {
          month: '2023-11',
          totalAmount: 7800.00,
          profit: 780.00,
          isPaid: false,
          comment: '部分核对',
          orderItems: [
            {
              type: 'flight',
              route: '广州-长沙往返',
              ticketNumber: 'PY-20231120-40',
              amount: 1800.00,
              date: '2023-11-20',
              comment: '经济舱'
            },
            {
              type: 'hotel',
              route: '长沙5晚住宿',
              ticketNumber: 'PY-20231120-41',
              amount: 2000.00,
              date: '2023-11-20',
              comment: '五一广场'
            },
            {
              type: 'other',
              route: '凤凰古城2日游',
              ticketNumber: 'PY-20231122-42',
              amount: 4000.00,
              date: '2023-11-22',
              comment: '含车费住宿'
            }
          ]
        }
      ]
    },
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
