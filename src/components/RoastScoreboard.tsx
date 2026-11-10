import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export interface DecisionLevel {
  label: string;
  description: string;
}

export interface DecisionQuestion {
  type: string;
  instructions: string;
  levels: DecisionLevel[];
}

export interface DecisionProbability {
  label: string;
  probability: number;
}

export interface DecisionAnswer {
  score: number;
  confidence: number;
  probabilities: DecisionProbability[];
}

export interface DecisionResponse {
  answers: DecisionAnswer[];
}

export interface SideState {
  score: string;
}

export const QUESTIONS: DecisionQuestion[] = [
  {
    type: 'score',
    instructions:
      "Score the brutality, wit, and impact of this roast chunk using the 0 to 5 scale below. This chunk is from a live roast battle where the AI has live camera vision of the human (their face, room, and real-time reactions), while the human is looking at a floating digital orb representing the AI. Factor in the asymmetry: the AI has a full visual target to pick apart, while the human only has a floating orb and the AI's voice/personality to attack. Hold the AI to a high standard so lazy visual observations score low, and reward the human when they find creative ways to violate a floating orb and its attitude.",
    levels: [
      {
        label: '0- Trash Tier',
        description:
          'Weak, stumbling, or completely generic attempt; either the AI made a lazy, obvious visual callout with no punchline, or the human threw a weak insult.',
      },
      {
        label: '1- Mild Burn',
        description:
          'A basic surface-level jab that lands lightly, but lacks real venom, cleverness, or devastating timing.',
      },
      {
        label: '2- Solid Cook',
        description:
          'A clean, sharp hit either the AI used its camera vision to snipe a specific detail effectively, or the human flipped the orb/AI persona angle into a solid punchline.',
      },
      {
        label: '3- Violated',
        description:
          'A ruthless, highly specific strike that exploits a real flaw, awkward reaction, or conversational opening with brutal precision.',
      },
      {
        label: "4- Smokathon Domination",
        description:
          "Total annihilation, either the AI weaponized its live vision for a surgical, soul-crushing takedown, or the human dismantled the orb and the AI's entire existence with zero mercy.",
      },
      {
        label: '5- Extinction Event',
        description:
          "God-tier, once-in-a-lifetime execution; a roast so diabolical, unhinged, and layered that it permanently ends the battle on the spot either the AI read the human's entire life story off a single camera frame, or the human broke the orb's logic so badly the machine practically needs a factory reset.",
      },
    ],
  },
];

declare global {
  interface Window {
    scoreRoast?: (input: string) => Promise<DecisionResponse>;
    updateSide?: (sidePrefix: string, answer: DecisionAnswer) => void;
    OPENAI_API_KEY?: string;
  }
}

export function RoastScoreboard() {
  const [aiState, setAiState] = useState<SideState>({
    score: '0.00',
  });

  const [humanState, setHumanState] = useState<SideState>({
    score: '0.00',
  });

  const updateSide = useCallback((sidePrefix: string, answer: DecisionAnswer) => {
    const formattedScore = Number(answer.score).toFixed(2);
    const normalizedSide = sidePrefix.toLowerCase().includes('ai') ? 'ai' : 'human';

    if (normalizedSide === 'ai') {
      setAiState({
        score: formattedScore,
      });
    } else {
      setHumanState({
        score: formattedScore,
      });
    }
  }, []);

  const scoreRoast = useCallback(
    async (input: string): Promise<DecisionResponse> => {
      const envKey =
        (typeof window !== 'undefined' && window.OPENAI_API_KEY) ||
        (typeof process !== 'undefined' && process.env && process.env.OPENAI_API_KEY) ||
        '';

      const endpoint = envKey ? 'https://api.openai.com/v1/decisions' : '/api/decisions';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (envKey) {
        headers['Authorization'] = `Bearer ${envKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: 'gpt-6-luna',
          input: input,
          questions: QUESTIONS,
        }),
      });

      const data = await response.json();
      const answer = data.answers[0];
      const side = input.trim().toLowerCase().startsWith('the_ai') ? 'ai' : 'human';
      updateSide(side, answer);
      return data;
    },
    [updateSide]
  );

  useEffect(() => {
    window.scoreRoast = scoreRoast;
    window.updateSide = updateSide;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data.roastInput === 'string') {
        scoreRoast(event.data.roastInput);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [scoreRoast, updateSide]);

  return (
    <Card
      id="roast-scoreboard"
      role="region"
      aria-label="Live Roast Battle Scoreboard"
      aria-roledescription="digital scoreboard comparing live roast scores between AI and human competitors"
      className="w-full max-w-[350px] min-[420px]:max-w-[400px] h-[105.993px] m-0 p-0 bg-[#050505] border-[1.5px] border-[#b5ff3b] rounded-[16px] grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] overflow-hidden shadow-none ring-0 gap-0"
    >
      {/* AI SIDE */}
      <div
        className="p-0 h-[100.773px] flex flex-col justify-between items-center text-center min-w-0 select-none"
        id="side-ai"
        role="group"
        aria-label="AI Competitor Score Panel"
        aria-labelledby="ai-name"
        aria-describedby="ai-score"
      >
        <div className="w-full flex justify-center items-baseline leading-none tracking-[0.02em] text-[#b5ff3b]">
          <span
            id="ai-name"
            aria-label="Competitor Name: THE_AI"
            aria-roledescription="competitor name"
            className="font-['Times_New_Roman',serif] text-[24px] pt-0 leading-none"
          >
            THE_AI
          </span>
        </div>

        <output
          className="font-['Times_New_Roman',serif] text-[75px] font-normal h-[63.75px] leading-[0.85] m-0 p-0 tracking-[-0.05em] text-white text-center w-full block focus:outline-none"
          id="ai-score"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-roledescription="digital decimal score from 0.00 to 5.00"
          aria-label={`Current AI Roast Score: ${aiState.score} points out of 5.00`}
          aria-valuenow={Number(aiState.score) || 0}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuetext={`${aiState.score} out of 5.00 points`}
          tabIndex={0}
        >
          {aiState.score}
        </output>
      </div>

      {/* DIVIDER */}
      <Separator
        orientation="vertical"
        role="separator"
        aria-orientation="vertical"
        aria-label="Scoreboard divider between AI and Human competitors"
        className="divider bg-[#b5ff3b]/35 h-full w-[1px]"
      />

      {/* HUMAN SIDE */}
      <div
        className="p-0 h-[100.773px] flex flex-col justify-between items-center text-center min-w-0 select-none"
        id="side-human"
        role="group"
        aria-label="Human Competitor Score Panel"
        aria-labelledby="human-name"
        aria-describedby="human-score"
      >
        <div className="w-full flex justify-center items-baseline leading-none tracking-[0.02em] text-[#b5ff3b]">
          <span
            id="human-name"
            aria-label="Competitor Name: THE_HUMAN"
            aria-roledescription="competitor name"
            className="font-['Times_New_Roman',serif] text-[24px] pt-0 pl-0 leading-none"
          >
            THE_HUMAN
          </span>
        </div>

        <output
          className="font-['Times_New_Roman',serif] text-[75px] font-normal h-[63.75px] leading-[0.85] m-0 p-0 tracking-[-0.05em] text-white text-center w-full block focus:outline-none"
          id="human-score"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-roledescription="digital decimal score from 0.00 to 5.00"
          aria-label={`Current Human Roast Score: ${humanState.score} points out of 5.00`}
          aria-valuenow={Number(humanState.score) || 0}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuetext={`${humanState.score} out of 5.00 points`}
          tabIndex={0}
        >
          {humanState.score}
        </output>
      </div>
    </Card>
  );
}
export default RoastScoreboard;
