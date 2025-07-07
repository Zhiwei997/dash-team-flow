import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  buttonText: string;
  iconBg: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

const FeatureCard = ({ 
  title, 
  description, 
  buttonText, 
  iconBg, 
  icon, 
  onClick 
}: FeatureCardProps) => {
  return (
    <Card className="p-6 bg-card-muted hover:bg-card transition-colors border-0 shadow-sm">
      <div className="flex flex-col items-center text-center space-y-4">
        {/* Icon */}
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl",
          iconBg
        )}>
          {icon}
        </div>
        
        {/* Content */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            {description}
          </p>
        </div>
        
        {/* Button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={onClick}
          className="mt-4 bg-card hover:bg-muted border-border"
        >
          {buttonText}
        </Button>
      </div>
    </Card>
  );
};

export default FeatureCard;