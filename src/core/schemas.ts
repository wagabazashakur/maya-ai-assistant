import { Type } from '@google/genai';

// Centralized JSON response schemas to avoid inline nesting in gemini.ts
export const SCHEMAS = {
  taskPlan: {
    type: Type.OBJECT,
    properties: {
      originalGoal: { type: Type.STRING },
      steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            step: { type: Type.NUMBER },
            command: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
        },
      },
    },
  },
  optimizePlan: {
    type: Type.OBJECT,
    properties: {
      goal: { type: Type.STRING },
      steps: { type: Type.ARRAY, items: { type: Type.STRING } },
      notes: { type: Type.STRING },
    },
  },
  highlightedLineArray: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        tokens: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              value: { type: Type.STRING },
            },
          },
        },
      },
    },
  },
  explanation: {
    type: Type.OBJECT,
    properties: {
      steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            command_part: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
        },
      },
    },
  },
  conventionalCommit: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING },
      scope: { type: Type.STRING },
      subject: { type: Type.STRING },
    },
  },
  healthReport: {
    type: Type.OBJECT,
    properties: {
      overall_status: { type: Type.STRING },
      disk_usage: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            filesystem: { type: Type.STRING },
            size: { type: Type.STRING },
            used: { type: Type.STRING },
            avail: { type: Type.STRING },
            use_percent: { type: Type.STRING },
            mounted_on: { type: Type.STRING },
            status: { type: Type.STRING },
          },
        },
      },
      top_processes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            user: { type: Type.STRING },
            pid: { type: Type.STRING },
            cpu_percent: { type: Type.STRING },
            mem_percent: { type: Type.STRING },
            command: { type: Type.STRING },
            status: { type: Type.STRING },
          },
        },
      },
    },
  },
  aiUsageReport: {
    type: Type.OBJECT,
    properties: {
      vimAiEdits: { type: Type.NUMBER },
      geminiCommands: { type: Type.NUMBER },
      learnedCorrections: { type: Type.NUMBER },
      refactors: { type: Type.NUMBER },
    },
  },
  evolutionSuggestion: {
    type: Type.OBJECT,
    properties: {
      type: { type: Type.STRING },
      name: { type: Type.STRING },
      value: { type: Type.STRING },
      explanation: { type: Type.STRING },
    },
  },
  securityReport: {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      findings: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            filePath: { type: Type.STRING },
            riskLevel: { type: Type.STRING },
            issue: { type: Type.STRING },
            suggestion: { type: Type.STRING },
          },
        },
      },
    },
  },
  critiqueReport: {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      findings: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            line: { type: Type.NUMBER },
            severity: { type: Type.STRING },
            issue: { type: Type.STRING },
            suggestion: { type: Type.STRING },
          },
        },
      },
    },
  },
  gitDigestReport: {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      key_changes: { type: Type.ARRAY, items: { type: Type.STRING } },
      affected_files: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
  },
  learningReport: {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      key_points: { type: Type.ARRAY, items: { type: Type.STRING } },
      example: { type: Type.STRING },
    },
  },
  journalReport: {
    type: Type.OBJECT,
    properties: {
      entries: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
        },
      },
    },
  },
  systemReport: {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      uptime: { type: Type.STRING },
      cpu_info: { type: Type.STRING },
      memory_usage: { type: Type.STRING },
      disk_usage: { type: Type.STRING },
      ip_address: { type: Type.STRING },
    },
  },
  scriptDocumentation: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      synopsis: { type: Type.STRING },
      description: { type: Type.STRING },
      arguments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
          },
        },
      },
    },
  },
  intentAnalysis: {
    type: Type.OBJECT,
    properties: {
      isHarmful: { type: Type.BOOLEAN },
      reason: { type: Type.STRING },
    },
  },
  troubleshootingStepArray: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING },
        explanation: { type: Type.STRING },
      },
    },
  },
  troubleshootingReport: {
    type: Type.OBJECT,
    properties: {
      analysis: { type: Type.STRING },
      cause: { type: Type.STRING },
      solution_steps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            command: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
        },
      },
    },
  },
  historyDigestReport: {
    type: Type.OBJECT,
    properties: {
      tasks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            goal: { type: Type.STRING },
            key_commands: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        },
      },
    },
  },
  auditReport: {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      findings: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            issue: { type: Type.STRING },
            suggestion: { type: Type.STRING },
          },
        },
      },
    },
  },
  portScanReport: {
    type: Type.OBJECT,
    properties: {
      results: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            port: { type: Type.NUMBER },
            state: { type: Type.STRING },
            service: { type: Type.STRING },
          },
        },
      },
    },
  },
  explainResult: {
    type: Type.OBJECT,
    properties: {
      file: { type: Type.STRING },
      summary: { type: Type.STRING },
      details: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
  },
  summarizeResult: {
    type: Type.OBJECT,
    properties: {
      file: { type: Type.STRING },
      inputPreview: { type: Type.STRING },
      summary: { type: Type.STRING },
      keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
  },
  suggestionItemArray: {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        source: { type: Type.STRING },
        suggestion: { type: Type.STRING },
      },
    },
  },
  improvementPlan: {
    type: Type.OBJECT,
    properties: {
      generatedAt: { type: Type.STRING },
      summary: { type: Type.STRING },
      consentRequired: { type: Type.BOOLEAN },
      actions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            description: { type: Type.STRING },
            appliesTo: { type: Type.STRING },
            type: { type: Type.STRING },
            diff: { type: Type.STRING },
            rollback: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                payload: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  },
  organizationPlan: {
    type: Type.OBJECT,
    properties: {
      commands: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
  },
  debugReport: {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      findings: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            line: { type: Type.NUMBER },
            issue: { type: Type.STRING },
            explanation: { type: Type.STRING },
            suggestion: { type: Type.STRING },
          },
        },
      },
      fixed_script: { type: Type.STRING },
    },
  },
} as const;
