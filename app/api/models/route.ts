import { NextResponse } from 'next/server'

export async function GET() {
  const models = {
    openai: [
      { id: 'gpt-4o', name: 'GPT-4o', context: '128k' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context: '128k' },
    ],
    gemini: [
      { id: 'gemini-2.5-pro-exp-03-25', name: 'Gemini 2.5 Pro', context: '1M' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', context: '1M' },
    ],
    anthropic: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', context: '200k' },
    ],
    deepseek: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', context: '64k' },
    ]
  }

  return NextResponse.json(models)
}
