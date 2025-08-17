// prisma/seed-questions.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const questionTemplates = [
  // ==================== BUSINESS CONTEXT ====================
  {
    name: 'Business Context',
    section: 'BUSINESS_CONTEXT',
    planType: 'ALL', // Available for all plans
    order: 1,
    isActive: true,
    version: 1,
    questions: [
      {
        code: 'target_audience',
        question: 'Who is your ideal customer?',
        helpText: 'Describe their demographics, needs, and pain points',
        placeholder: 'Small business owners aged 30-50 who need accounting services...',
        type: 'TEXTAREA',
        required: true,
        order: 1,
        validation: {
          minLength: 20,
          maxLength: 1000
        }
      },
      {
        code: 'unique_value',
        question: 'What makes your business different from competitors?',
        helpText: 'Your unique selling proposition',
        placeholder: 'We\'re the only local bakery that offers 24-hour delivery...',
        type: 'TEXTAREA',
        required: true,
        order: 2,
        validation: {
          minLength: 20,
          maxLength: 800
        }
      },
      {
        code: 'business_personality',
        question: 'If your business was a person, how would you describe their personality?',
        helpText: 'This helps us nail the right tone and feel',
        placeholder: 'Professional but approachable, innovative, trustworthy...',
        type: 'TEXTAREA',
        required: true,
        order: 3,
        validation: {
          minLength: 15,
          maxLength: 500
        }
      },
      {
        code: 'competitors',
        question: 'List 2-3 competitors or websites you admire (optional)',
        helpText: 'We\'ll analyze what works in your industry',
        placeholder: 'www.competitor1.com, www.inspiration-site.com',
        type: 'TEXTAREA',
        required: false,
        order: 4,
        validation: {
          maxLength: 500
        }
      }
    ]
  },

  // ==================== PROJECT GOALS ====================
  {
    name: 'Project Goals',
    section: 'PROJECT_GOALS',
    planType: 'ALL',
    order: 2,
    isActive: true,
    version: 1,
    questions: [
      {
        code: 'primary_goal',
        question: 'What\'s the #1 thing you want visitors to do on your site?',
        helpText: 'Your main conversion goal',
        type: 'SELECT',
        required: true,
        order: 1,
        options: [
          { value: 'contact_quote', label: 'Contact me for a quote' },
          { value: 'purchase_online', label: 'Purchase products online' },
          { value: 'book_appointment', label: 'Book an appointment' },
          { value: 'download_resources', label: 'Download resources' },
          { value: 'learn_services', label: 'Learn about my services' },
          { value: 'subscribe_newsletter', label: 'Subscribe to newsletter' },
          { value: 'other', label: 'Other (specify in next question)' }
        ]
      },
      {
        code: 'primary_goal_other',
        question: 'Please specify your primary goal',
        helpText: 'Since you selected \'Other\', please describe your specific goal',
        type: 'TEXT',
        required: true,
        order: 2,
        conditionalOn: {
          questionCode: 'primary_goal',
          hasValue: 'other'
        }
      },
      {
        code: 'success_metrics',
        question: 'How will you measure if your website is successful?',
        helpText: 'Be specific about numbers and timeframes',
        placeholder: 'Getting 10 new leads per month, 50 newsletter signups...',
        type: 'TEXTAREA',
        required: true,
        order: 3,
        validation: {
          minLength: 20,
          maxLength: 800
        }
      },
      {
        code: 'problems_solving',
        question: 'What current problem will this website solve for your business?',
        helpText: 'Understanding pain points helps us prioritize features',
        placeholder: 'Customers can\'t find our hours, we\'re losing sales to competitors with better online presence...',
        type: 'TEXTAREA',
        required: true,
        order: 4,
        validation: {
          minLength: 20,
          maxLength: 800
        }
      },
      {
        code: 'must_have_features',
        question: 'Select your must-have features',
        helpText: 'Choose the features that are essential for your website',
        type: 'MULTI_SELECT',
        required: true,
        order: 5,
        maxSelections: 10, // Will be overridden per plan type
        options: [
          { value: 'online_booking', label: 'Online booking/scheduling' },
          { value: 'ecommerce', label: 'E-commerce/shopping cart' },
          { value: 'customer_portal', label: 'Customer portal/login' },
          { value: 'live_chat', label: 'Live chat' },
          { value: 'blog', label: 'Blog/news section' },
          { value: 'gallery', label: 'Gallery/portfolio' },
          { value: 'multi_language', label: 'Multi-language support' },
          { value: 'email_automation', label: 'Email automation' },
          { value: 'social_integration', label: 'Social media integration' },
          { value: 'search', label: 'Search functionality' },
          { value: 'contact_forms', label: 'Contact forms' },
          { value: 'newsletter', label: 'Newsletter signup' },
          { value: 'testimonials', label: 'Testimonials/reviews' },
          { value: 'faq', label: 'FAQ section' }
        ]
      }
    ]
  },

  // ==================== DESIGN PREFERENCES ====================
  {
    name: 'Design Preferences',
    section: 'DESIGN_PREFERENCES',
    planType: 'ALL',
    order: 3,
    isActive: true,
    version: 1,
    questions: [
      {
        code: 'visual_style',
        question: 'Which visual style best represents your brand?',
        helpText: 'Select up to 2 styles that resonate with your brand',
        type: 'MULTI_SELECT',
        required: true,
        order: 1,
        maxSelections: 2,
        options: [
          {
            value: 'modern_minimal',
            label: 'Modern & Minimal',
            metadata: { image: '/styles/minimal.jpg' }
          },
          {
            value: 'bold_colorful',
            label: 'Bold & Colorful',
            metadata: { image: '/styles/bold.jpg' }
          },
          {
            value: 'elegant_luxury',
            label: 'Elegant & Luxury',
            metadata: { image: '/styles/luxury.jpg' }
          },
          {
            value: 'friendly_playful',
            label: 'Friendly & Playful',
            metadata: { image: '/styles/playful.jpg' }
          },
          {
            value: 'corporate_professional',
            label: 'Corporate & Professional',
            metadata: { image: '/styles/corporate.jpg' }
          },
          {
            value: 'organic_natural',
            label: 'Organic & Natural',
            metadata: { image: '/styles/natural.jpg' }
          },
          {
            value: 'tech_futuristic',
            label: 'Tech & Futuristic',
            metadata: { image: '/styles/tech.jpg' }
          },
          {
            value: 'vintage_classic',
            label: 'Vintage & Classic',
            metadata: { image: '/styles/vintage.jpg' }
          }
        ]
      },
      {
        code: 'color_emotions',
        question: 'What emotions should your colors evoke?',
        helpText: 'We\'ll select colors that match these feelings',
        placeholder: 'Trust and reliability with a touch of innovation...',
        type: 'TEXTAREA',
        required: true,
        order: 2,
        validation: {
          minLength: 15,
          maxLength: 500
        }
      },
      {
        code: 'inspiration_elements',
        question: 'What specific design elements do you love?',
        helpText: 'Check all that apply',
        type: 'MULTI_SELECT',
        required: true,
        order: 3,
        options: [
          { value: 'large_hero_images', label: 'Large hero images' },
          { value: 'animated_interactions', label: 'Animated interactions' },
          { value: 'video_backgrounds', label: 'Video backgrounds' },
          { value: 'geometric_patterns', label: 'Geometric patterns' },
          { value: 'illustrations', label: 'Hand-drawn illustrations' },
          { value: 'gradients', label: 'Gradient colors' },
          { value: 'dark_mode', label: 'Dark mode' },
          { value: 'minimalist', label: 'Minimalist layout' },
          { value: 'card_design', label: 'Card-based design' },
          { value: 'parallax', label: 'Parallax scrolling' },
          { value: 'bold_typography', label: 'Bold typography' },
          { value: 'subtle_shadows', label: 'Subtle shadows' },
          { value: '3d_elements', label: '3D elements' },
          { value: 'asymmetric_layouts', label: 'Asymmetric layouts' }
        ]
      },
      {
        code: 'avoid_elements',
        question: 'What should we definitely AVOID in your design?',
        helpText: 'Tell us your design pet peeves',
        placeholder: 'No stock photos of people in suits, no cursive fonts, nothing that looks dated...',
        type: 'TEXTAREA',
        required: false,
        order: 4,
        validation: {
          maxLength: 500
        }
      }
    ]
  },

  // ==================== CONTENT STRUCTURE - LANDING ====================
  {
    name: 'Content Structure - Landing Page',
    section: 'CONTENT_STRUCTURE',
    planType: 'LANDING',
    order: 4,
    isActive: true,
    version: 1,
    questions: [
      {
        code: 'hero_message',
        question: 'What\'s your main headline message?',
        helpText: 'The first thing visitors will read',
        placeholder: 'Transform Your Business with AI-Powered Solutions',
        type: 'TEXT',
        required: true,
        order: 1,
        validation: {
          minLength: 5,
          maxLength: 100
        }
      },
      {
        code: 'hero_subheadline',
        question: 'What\'s your supporting subheadline?',
        helpText: 'A brief explanation under your main headline',
        placeholder: 'Save time and increase revenue with our cutting-edge automation tools',
        type: 'TEXTAREA',
        required: true,
        order: 2,
        validation: {
          maxLength: 200
        }
      },
      {
        code: 'key_benefits',
        question: 'List 3-5 key benefits or features to highlight',
        helpText: 'What makes your offer irresistible?',
        placeholder: '1. Save 10 hours per week\n2. Reduce costs by 40%\n3. 24/7 customer support',
        type: 'TEXTAREA',
        required: true,
        order: 3,
        validation: {
          minLength: 30,
          maxLength: 800
        }
      },
      {
        code: 'social_proof',
        question: 'What credibility indicators do you have?',
        helpText: 'Select all that apply',
        type: 'MULTI_SELECT',
        required: true,
        order: 4,
        options: [
          { value: 'testimonials', label: 'Customer testimonials' },
          { value: 'client_logos', label: 'Client logos' },
          { value: 'years_business', label: 'Years in business' },
          { value: 'customer_count', label: 'Number of customers served' },
          { value: 'awards', label: 'Awards/certifications' },
          { value: 'media_mentions', label: 'Media mentions' },
          { value: 'case_studies', label: 'Case studies' },
          { value: 'reviews', label: 'Reviews/ratings' },
          { value: 'none_yet', label: 'None yet (we\'ll help you plan for this)' }
        ]
      },
      {
        code: 'call_to_action',
        question: 'What should your main button say?',
        helpText: 'Action-oriented text for your primary CTA',
        placeholder: 'Get Started Free, Book a Demo, Get Your Quote...',
        type: 'TEXT',
        required: true,
        order: 5,
        validation: {
          minLength: 2,
          maxLength: 30
        }
      }
    ]
  },

  // ==================== CONTENT STRUCTURE - WEBSITE ====================
  {
    name: 'Content Structure - Full Website',
    section: 'CONTENT_STRUCTURE',
    planType: 'WEBSITE',
    order: 4,
    isActive: true,
    version: 1,
    questions: [
      {
        code: 'site_sections',
        question: 'Which pages/sections do you need?',
        helpText: 'Select all pages you want on your website',
        type: 'MULTI_SELECT',
        required: true,
        order: 1,
        maxSelections: 10,
        options: [
          { value: 'homepage', label: 'Homepage', metadata: { default: true } },
          { value: 'about', label: 'About Us', metadata: { default: true } },
          { value: 'services', label: 'Services/Products', metadata: { default: true } },
          { value: 'portfolio', label: 'Portfolio/Gallery' },
          { value: 'testimonials', label: 'Testimonials' },
          { value: 'blog', label: 'Blog/News' },
          { value: 'contact', label: 'Contact', metadata: { default: true } },
          { value: 'faq', label: 'FAQ' },
          { value: 'team', label: 'Team' },
          { value: 'pricing', label: 'Pricing' },
          { value: 'case_studies', label: 'Case Studies' },
          { value: 'resources', label: 'Resources/Downloads' },
          { value: 'careers', label: 'Careers' },
          { value: 'privacy', label: 'Privacy/Terms' }
        ]
      },
      {
        code: 'content_ready',
        question: 'How much content do you already have prepared?',
        helpText: 'This helps us understand the scope of content creation needed',
        type: 'SELECT',
        required: true,
        order: 2,
        options: [
          { value: 'all_ready', label: 'All content is written and ready' },
          { value: 'some_ready', label: 'Some content ready, some needs writing' },
          { value: 'outline_only', label: 'I have an outline but no written content' },
          { value: 'need_help', label: 'I need help creating all content' }
        ]
      },
      {
        code: 'customer_questions',
        question: 'What are the top 3 questions customers always ask?',
        helpText: 'We\'ll make sure these are prominently answered',
        placeholder: '1. How much does it cost?\n2. How long does it take?\n3. Do you offer warranties?',
        type: 'TEXTAREA',
        required: true,
        order: 3,
        validation: {
          minLength: 30,
          maxLength: 800
        }
      },
      {
        code: 'seo_focus',
        question: 'What search terms should people use to find you?',
        helpText: 'Keywords for SEO optimization',
        placeholder: 'Chicago wedding photographer, affordable family portraits, corporate headshots near me...',
        type: 'TEXTAREA',
        required: false,
        order: 4,
        validation: {
          maxLength: 500
        }
      },
      {
        code: 'homepage_sections',
        question: 'What sections should appear on your homepage?',
        helpText: 'Select and we\'ll arrange them optimally',
        type: 'MULTI_SELECT',
        required: true,
        order: 5,
        options: [
          { value: 'hero_banner', label: 'Hero banner with CTA', metadata: { default: true } },
          { value: 'services_overview', label: 'Services overview' },
          { value: 'about_teaser', label: 'About us teaser' },
          { value: 'testimonials', label: 'Customer testimonials' },
          { value: 'portfolio_showcase', label: 'Portfolio showcase' },
          { value: 'stats_numbers', label: 'Stats/numbers' },
          { value: 'process_steps', label: 'How it works/process' },
          { value: 'team_preview', label: 'Team preview' },
          { value: 'blog_latest', label: 'Latest blog posts' },
          { value: 'cta_section', label: 'Call-to-action section' },
          { value: 'faq_preview', label: 'FAQ preview' },
          { value: 'contact_info', label: 'Contact information' }
        ]
      }
    ]
  },

  // ==================== CONTENT STRUCTURE - PRO ====================
  {
    name: 'Content Structure - Pro Website',
    section: 'CONTENT_STRUCTURE',
    planType: 'PRO',
    order: 4,
    isActive: true,
    version: 1,
    questions: [
      {
        code: 'user_journeys',
        question: 'Describe the different user types and their journeys',
        helpText: 'Map out how different users will navigate your site',
        placeholder: 'New customers: Land on homepage → Browse services → Request quote\nExisting clients: Login → Access dashboard → Download reports',
        type: 'TEXTAREA',
        required: true,
        order: 1,
        validation: {
          minLength: 50,
          maxLength: 2000
        }
      },
      {
        code: 'integrations',
        question: 'What systems or tools need to integrate with your website?',
        helpText: 'Third-party services and APIs',
        placeholder: 'CRM (Salesforce), Email (Mailchimp), Payment (Stripe), Calendar (Calendly)...',
        type: 'TEXTAREA',
        required: true,
        order: 2,
        validation: {
          minLength: 10,
          maxLength: 1000
        }
      },
      {
        code: 'dynamic_content',
        question: 'What content needs to update automatically?',
        helpText: 'Content that changes without manual updates',
        placeholder: 'Product inventory from database, Instagram feed, Google reviews, news from RSS feed...',
        type: 'TEXTAREA',
        required: true,
        order: 3,
        validation: {
          minLength: 20,
          maxLength: 1000
        }
      },
      {
        code: 'advanced_features',
        question: 'Select advanced functionality needed',
        helpText: 'Complex features for your pro website',
        type: 'MULTI_SELECT',
        required: true,
        order: 4,
        options: [
          { value: 'user_auth', label: 'User authentication/accounts' },
          { value: 'payment_processing', label: 'Payment processing' },
          { value: 'subscription_mgmt', label: 'Subscription management' },
          { value: 'advanced_search', label: 'Advanced search/filtering' },
          { value: 'multi_step_forms', label: 'Multi-step forms' },
          { value: 'file_upload', label: 'File upload/management' },
          { value: 'api_development', label: 'API development' },
          { value: 'custom_calculators', label: 'Custom calculators/tools' },
          { value: 'data_visualization', label: 'Data visualization/charts' },
          { value: 'workflow_automation', label: 'Workflow automation' },
          { value: 'multi_tenant', label: 'Multi-tenant architecture' },
          { value: 'real_time_updates', label: 'Real-time updates' },
          { value: 'email_campaigns', label: 'Email campaign management' },
          { value: 'inventory_management', label: 'Inventory management' },
          { value: 'booking_system', label: 'Advanced booking system' },
          { value: 'custom_dashboard', label: 'Custom admin dashboard' }
        ]
      },
      {
        code: 'custom_requirements',
        question: 'Describe any unique or custom requirements',
        helpText: 'Special features not covered in standard options',
        placeholder: 'We need a custom quote calculator that factors in distance, materials, and urgency...',
        type: 'TEXTAREA',
        required: false,
        order: 5,
        validation: {
          maxLength: 2000
        }
      }
    ]
  },

  // ==================== ADDITIONAL CONTEXT ====================
  {
    name: 'Additional Context',
    section: 'ADDITIONAL_CONTEXT',
    planType: 'ALL',
    order: 5,
    isActive: true,
    version: 1,
    questions: [
      {
        code: 'timeline_urgency',
        question: 'When do you need this completed and why?',
        helpText: 'Understanding urgency helps us prioritize',
        placeholder: 'By January for our trade show, before summer wedding season starts...',
        type: 'TEXTAREA',
        required: true,
        order: 1,
        validation: {
          minLength: 10,
          maxLength: 500
        }
      },
      {
        code: 'budget_priorities',
        question: 'If budget was tight, what\'s most important to get right?',
        helpText: 'Helps us focus on what matters most',
        placeholder: 'Mobile experience is critical since 70% of our users are on phones...',
        type: 'TEXTAREA',
        required: true,
        order: 2,
        validation: {
          minLength: 20,
          maxLength: 800
        }
      },
      {
        code: 'future_vision',
        question: 'Where do you see this website in 2 years?',
        helpText: 'We\'ll build with your growth in mind',
        placeholder: 'Handling 1000+ orders per month, expanded to 3 languages, integrated with our app...',
        type: 'TEXTAREA',
        required: false,
        order: 3,
        validation: {
          maxLength: 1000
        }
      },
      {
        code: 'anything_else',
        question: 'Anything else we should know?',
        helpText: 'Context that doesn\'t fit elsewhere',
        placeholder: 'Our CEO loves purple, we\'re rebranding next year, our biggest competitor is...',
        type: 'TEXTAREA',
        required: false,
        order: 4,
        validation: {
          maxLength: 1500
        }
      }
    ]
  },

  // ==================== E-COMMERCE ADDON (Conditional) ====================
  {
    name: 'E-commerce Details',
    section: 'CONTENT_STRUCTURE',
    planType: 'ALL',
    order: 6,
    isActive: true,
    version: 1,
    questions: [
      {
        code: 'product_count',
        question: 'How many products will you sell?',
        helpText: 'This helps us design the right catalog structure',
        type: 'SELECT',
        required: true,
        order: 1,
        conditionalOn: {
          questionCode: 'must_have_features',
          hasValue: 'ecommerce'
        },
        options: [
          { value: '1-10', label: '1-10 products' },
          { value: '10-50', label: '10-50 products' },
          { value: '50-200', label: '50-200 products' },
          { value: '200-1000', label: '200-1000 products' },
          { value: '1000+', label: '1000+ products' }
        ]
      },
      {
        code: 'product_types',
        question: 'What types of products will you sell?',
        helpText: 'Select all that apply',
        type: 'MULTI_SELECT',
        required: true,
        order: 2,
        conditionalOn: {
          questionCode: 'must_have_features',
          hasValue: 'ecommerce'
        },
        options: [
          { value: 'physical', label: 'Physical products' },
          { value: 'digital', label: 'Digital downloads' },
          { value: 'services', label: 'Services' },
          { value: 'subscriptions', label: 'Subscriptions' },
          { value: 'bookings', label: 'Bookings/appointments' },
          { value: 'courses', label: 'Courses/training' }
        ]
      },
      {
        code: 'payment_methods',
        question: 'Which payment methods do you need?',
        helpText: 'Select all payment options you want to offer',
        type: 'MULTI_SELECT',
        required: true,
        order: 3,
        conditionalOn: {
          questionCode: 'must_have_features',
          hasValue: 'ecommerce'
        },
        options: [
          { value: 'credit_card', label: 'Credit/Debit Card' },
          { value: 'paypal', label: 'PayPal' },
          { value: 'stripe', label: 'Stripe' },
          { value: 'bank_transfer', label: 'Bank Transfer' },
          { value: 'cash_delivery', label: 'Cash on Delivery' },
          { value: 'crypto', label: 'Cryptocurrency' },
          { value: 'buy_now_pay_later', label: 'Buy Now Pay Later' }
        ]
      },
      {
        code: 'shipping_requirements',
        question: 'Describe your shipping needs',
        helpText: 'How will products be delivered?',
        placeholder: 'Local delivery only within 50km, international shipping with calculated rates...',
        type: 'TEXTAREA',
        required: true,
        order: 4,
        conditionalOn: {
          questionCode: 'product_types',
          hasValue: 'physical'
        },
        validation: {
          maxLength: 500
        }
      }
    ]
  }
]

async function seedQuestions () {
  console.log('🌱 Starting to seed questions...')

  try {
    // Clear existing data (optional - remove in production)
    await prisma.projectAnswer.deleteMany({})
    await prisma.question.deleteMany({})
    await prisma.questionTemplate.deleteMany({})

    console.log('✨ Cleared existing questions')

    // Create templates with questions
    for (const templateData of questionTemplates) {
      const { questions, ...template } = templateData

      const createdTemplate = await prisma.questionTemplate.create({
        data: {
          ...template,
          questions: {
            create: questions.map(q => ({
              ...q,
              options: q.options ? JSON.stringify(q.options) : null,
              validation: q.validation ? JSON.stringify(q.validation) : null,
              conditionalOn: q.conditionalOn ? JSON.stringify(q.conditionalOn) : null,
              isActive: true
            }))
          }
        },
        include: {
          questions: true
        }
      })

      console.log(`✅ Created template: ${createdTemplate.name} with ${createdTemplate.questions.length} questions`)
    }

    // Create plan-specific variations for must_have_features
    const featureQuestions = await prisma.question.findMany({
      where: { code: 'must_have_features' }
    })

    for (const question of featureQuestions) {
      const template = await prisma.questionTemplate.findUnique({
        where: { id: question.templateId }
      })

      // Update max selections based on plan type
      let maxSelections = 10
      if (template?.planType === 'LANDING') {
        maxSelections = 3
      } else if (template?.planType === 'WEBSITE') {
        maxSelections = 5
      }

      await prisma.question.update({
        where: { id: question.id },
        data: { maxSelections }
      })
    }

    console.log('🎉 Successfully seeded all question templates!')

    // Print summary
    const templateCount = await prisma.questionTemplate.count()
    const questionCount = await prisma.question.count()

    console.log(`\n📊 Summary:`)
    console.log(`   - Templates created: ${templateCount}`)
    console.log(`   - Questions created: ${questionCount}`)

  } catch (error) {
    console.error('❌ Error seeding questions:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed
seedQuestions()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
