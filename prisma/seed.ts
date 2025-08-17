import { PrismaClient } from '@prisma/client'
import { BillingCycle, Currency } from '~~/types/plans'

const db = new PrismaClient()

const now = new Date()

export const seed = async () => {
  console.log('Seeding plans...')
  await db.plan.deleteMany()
  await db.planVersion.deleteMany()

  const plans = [
    {
      name: 'Landing Page',
      description: 'AI-made landing page delivered in 3 days. Best for promoting a single product or service.',
      features: [
        'AI-generated landing page within 3 days',
        '1 monthly update',
        'Mobile responsive design',
        'Basic SEO setup',
        'Free hosting + SSL',
        'Custom domain support'
      ],
      isActive: true,
      versions: [
        {
          price: 500,
          startsAt: now,
          currency: Currency.MXN,
          billingCycle: BillingCycle.MONTHLY,
        },
        {
          price: 5000,
          startsAt: now,
          currency: Currency.MXN,
          billingCycle: BillingCycle.YEARLY,
        }
      ]
    },
    {
      name: 'Starter Site',
      description: 'AI-made website delivered in 3 days. Best for individuals and small service businesses.',
      features: [
        'AI-generated website within 3 days',
        '1 monthly update',
        'Mobile responsive design',
        'Basic SEO setup',
        'Free hosting + SSL',
        'Custom domain support'
      ],
      isActive: true,
      versions: [
        {
          price: 1000,
          startsAt: now,
          currency: Currency.MXN,
          billingCycle: BillingCycle.MONTHLY,
        },
        {
          price: 10000,
          startsAt: now,
          currency: Currency.MXN,
          billingCycle: BillingCycle.YEARLY,
        }
      ]
    },
    {
      name: 'Business Pro',
      description: 'Pre-designed websites with light e-commerce. Best for growing businesses.',
      features: [
        'Choose from pre-designed templates',
        'Basic e-commerce (up to 10 products)',
        '2 monthly updates',
        'Chat widget + contact form',
        'Analytics + SEO',
        'Custom domain + hosting'
      ],
      isActive: true,
      versions: [
        {
          price: 2500,
          startsAt: now,
          currency: Currency.MXN,
          billingCycle: BillingCycle.MONTHLY,
        },
        {
          price: 25000,
          startsAt: now,
          currency: Currency.MXN,
          billingCycle: BillingCycle.YEARLY,
        }
      ]
    },
    {
      name: 'Enterprise Custom',
      description: 'Custom-made site, integrations, and full support. Ideal for established or scaling businesses.',
      features: [
        'Fully custom design and UX',
        'Unlimited monthly updates',
        'Advanced integrations (API, CRM, etc.)',
        'Multilingual site',
        'Legal & privacy compliance setup',
        'Priority support and strategic consultations'
      ],
      isActive: true,
      versions:[
        {
          price: 8000,
          startsAt: now,
          currency: Currency.MXN,
          billingCycle: BillingCycle.MONTHLY,
        },
        {
          price: 80000,
          startsAt: now,
          currency: Currency.MXN,
          billingCycle: BillingCycle.YEARLY,
        }
      ]
    },
  ]

  for (const plan of plans) {
    const existing = await db.plan.findFirst({
      where: { name: plan.name }
    })
    if (existing) {
      console.log(`Plan "${plan.name}" already exists, skipping...`)
      continue
    }
    const p = await db.plan.create({
      data: {
        name: plan.name,
        description: plan.description,
        isActive: plan.isActive
      }
    })
    console.log(`Created plan: ${p.name}`)
    for (const version of plan.versions) {
      await db.planVersion.create({
        data: {
          planId: p.id,
          price: version.price,
          currency: version.currency,
          features: plan.features,
          billingCycle: version.billingCycle,
          effectiveAt: version.startsAt,
        }
      })
      console.log(`Created plan version for ${p.name}: ${version.price} ${version.currency} (${version.billingCycle})`)
    }

  }

  console.log('✅ Plans seeded.')

  await db.$disconnect()

}

