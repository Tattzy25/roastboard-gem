/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoastScoreboard } from '@/src/components/RoastScoreboard';

export default function App() {
  return (
    <div className="w-full min-h-screen bg-black text-white flex justify-center items-start pt-2 px-2 overflow-hidden font-['Inter',sans-serif]">
      <RoastScoreboard />
    </div>
  );
}
