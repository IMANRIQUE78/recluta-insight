import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { GlobalLeaderboardModal } from "./GlobalLeaderboardModal";

export const GlobalLeaderboard = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Card 
        className="shadow-md hover:shadow-lg transition-shadow cursor-pointer" 
        id="global-leaderboard"
        onClick={() => setModalOpen(true)}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Ranking Global de Reclutadores
              </CardTitle>
              <CardDescription>
                Ver clasificación mundial de todos los reclutadores de la plataforma
              </CardDescription>
            </div>
            <Button variant="default" size="lg">
              Ver Ranking
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Haz clic para ver tu posición en el ranking global y compararte con otros reclutadores
            </p>
          </div>
        </CardContent>
      </Card>

      <GlobalLeaderboardModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};

