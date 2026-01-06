'use server';

/**
 * @fileOverview A flow for enabling and adjusting channel automations.
 *
 * - enableAdjustAutomations - A function that handles enabling and adjusting channel automations.
 * - EnableAdjustAutomationsInput - The input type for the enableAdjustAutomations function.
 * - EnableAdjustAutomationsOutput - The return type for the enableAdjustAutomations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnableAdjustAutomationsInputSchema = z.object({
  channelName: z.string().describe('The name of the channel.'),
  channelDescription: z.string().describe('The description of the channel.'),
  memberList: z.array(z.string()).describe('A list of members in the channel.'),
  automationSettings: z
    .record(z.boolean())
    .describe(
      'A map of automation names to boolean values indicating whether the automation is enabled.'
    ),
  automationAdjustments: z
    .record(z.string())
    .optional()
    .describe(
      'A map of automation names to adjustment settings, as strings.  These are optional, and may not exist for all automations.'
    ),
});
export type EnableAdjustAutomationsInput = z.infer<
  typeof EnableAdjustAutomationsInputSchema
>;

const EnableAdjustAutomationsOutputSchema = z.object({
  configuredAutomations: z
    .record(z.string())
    .describe('A map of automation names to their final configuration.'),
});
export type EnableAdjustAutomationsOutput = z.infer<
  typeof EnableAdjustAutomationsOutputSchema
>;

export async function enableAdjustAutomations(
  input: EnableAdjustAutomationsInput
): Promise<EnableAdjustAutomationsOutput> {
  return enableAdjustAutomationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enableAdjustAutomationsPrompt',
  input: {schema: EnableAdjustAutomationsInputSchema},
  output: {schema: EnableAdjustAutomationsOutputSchema},
  prompt: `You are a channel automation configuration expert. You take in a
channel name, description, member list, desired automation settings, and
automation adjustments, and you output the final configuration for each
automation.

Channel Name: {{{channelName}}}
Channel Description: {{{channelDescription}}}
Member List: {{#each memberList}}{{{this}}}, {{/each}}
Automation Settings: {{JSON automationSettings}}
Automation Adjustments: {{JSON automationAdjustments}}

For each automation that is enabled, provide its final configuration. Take
into account both the desired settings and any adjustments.

Output the configuration as a map of automation names to their final
configuration.

Example:
{
  "welcomeMessage": "Welcome to the channel, @user!",
  "scheduledEventInvite": "We have a scheduled event on Friday at 3pm!",
  "iceBreaker": "What is your favorite hobby?",
}
`,
});

const enableAdjustAutomationsFlow = ai.defineFlow(
  {
    name: 'enableAdjustAutomationsFlow',
    inputSchema: EnableAdjustAutomationsInputSchema,
    outputSchema: EnableAdjustAutomationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
