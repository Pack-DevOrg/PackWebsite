import React, {useState} from "react";
import {QueryClientProvider} from "@tanstack/react-query";
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider";
import {createQueryClient} from "@/queryClient";
import NonHomeApp from "./NonHomeApp";

const NonHomeRuntime: React.FC = () => {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ServiceWorkerProvider>
        <NonHomeApp />
      </ServiceWorkerProvider>
    </QueryClientProvider>
  );
};

export default NonHomeRuntime;
