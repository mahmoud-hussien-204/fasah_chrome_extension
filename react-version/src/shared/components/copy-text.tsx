import { CopyIcon } from 'lucide-react';

import { useState } from 'react';

type IProps = {
  text: string;
  lettersToShow?: number;
};

const CopyText = ({ text, lettersToShow = 3 }: IProps) => {
  const [copied, setCopied] = useState(false);

  const shortText = `${text.slice(0, lettersToShow)}...${text.slice(-lettersToShow)}`;

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`text-foreground bg-muted hover:bg-input relative inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-sm transition ${copied ? 'text-green-600' : 'text-foreground'}`}
    >
      <span>{shortText}</span>
      <CopyIcon size={16} />
    </button>
  );
};

export default CopyText;
