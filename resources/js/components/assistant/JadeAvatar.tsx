import { motion, useReducedMotion } from 'motion/react';
import { Sparkle, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const JADE_WEBP = '/jadeAssistantAnimation/idle/jade.webp';

const sizeMap = {
    sm: { base: 'size-8', glow: 'size-12', ring: 'size-10', orbit: 'size-14', icon: 'size-3.5', radius: 'rounded-lg' },
    md: { base: 'size-10', glow: 'size-16', ring: 'size-12', orbit: 'size-18', icon: 'size-5', radius: 'rounded-xl' },
    lg: { base: 'size-16', glow: 'size-24', ring: 'size-20', orbit: 'size-28', icon: 'size-8', radius: 'rounded-2xl' },
} as const;

type JadeAvatarProps = {
    size?: keyof typeof sizeMap;
    className?: string;
};

function JadeAvatar({ size = 'md', className }: JadeAvatarProps) {
    const reducedMotion = useReducedMotion();
    const [imgFailed, setImgFailed] = useState(false);
    const dims = sizeMap[size];

    return (
        <div className={cn('relative shrink-0', dims.base, className)}>
            {!reducedMotion && (
                <>
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <motion.div
                            className={cn('rounded-full bg-gold/30 blur-lg', dims.glow)}
                            animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.8, 0.45] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </div>

                    {[0, 1].map((i) => (
                        <div
                            key={i}
                            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        >
                            <motion.span
                                className={cn('block rounded-full border border-gold/50', dims.ring)}
                                initial={{ scale: 0.6, opacity: 0.7 }}
                                animate={{ scale: 1.6, opacity: 0 }}
                                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: i * 1.2 }}
                            />
                        </div>
                    ))}
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <motion.div
                            className={cn('absolute -translate-x-1/2 -translate-y-1/2', dims.orbit)}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        >
                            <span className="absolute left-1/2 -top-1 -translate-x-1/2 text-gold-strong">
                                <Sparkle className={cn('fill-current', size === 'sm' ? 'size-2.5' : 'size-3.5')} />
                            </span>
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-gold-strong">
                                <Sparkle className={cn('fill-current', size === 'sm' ? 'size-2.5' : 'size-3.5')} />
                            </span>
                        </motion.div>
                    </div>
                </>
            )}

            <div className={cn('absolute inset-0 overflow-hidden', dims.radius)}>
                {imgFailed ? (
                    <div className="flex size-full items-center justify-center bg-gradient-to-br from-gold/30 to-gold/10 text-gold-strong">
                        <Sparkles className={dims.icon} />
                    </div>
                ) : (
                    <img
                        src={JADE_WEBP}
                        alt="Jade, your AI assistant"
                        draggable={false}
                        onError={() => setImgFailed(true)}
                        className="size-full object-contain"
                    />
                )}
            </div>
        </div>
    );
}

export default JadeAvatar;
