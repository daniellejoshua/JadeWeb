import { cn } from '@/lib/utils';
import { RobotHead, type RobotHeadState } from 'robot-heads';

type JadeAvatarProps = {
    size?: number;
    state?: RobotHeadState;
    className?: string;
    interactive?: boolean;
    antenna?: boolean;
    label?: string;
    paused?: boolean;
};

export type JadeRobotState = RobotHeadState;

function JadeAvatar({
    size = 44,
    state = 'idle',
    className,
    interactive = false,
    antenna = size >= 64,
    label = `Jade AI, ${state}`,
    paused = false,
}: JadeAvatarProps) {
    return (
        <RobotHead
            key={state}
            shape="rectangle"
            state={state}
            size={size}
            color="#e0ad1f"
            seed={0}
            interactive={interactive}
            antenna={antenna}
            floorShadow={size >= 64}
            paused={paused}
            aria-label={label}
            className={cn('shrink-0 print:hidden', className)}
        />
    );
}

export default JadeAvatar;
