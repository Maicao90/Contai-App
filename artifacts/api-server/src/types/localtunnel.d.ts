declare module "localtunnel" {
  type Tunnel = {
    url: string;
    close: () => void;
    on?: (event: string, listener: () => void) => void;
  };

  type TunnelOptions = {
    port: number;
    subdomain?: string;
  };

  export default function localtunnel(options: TunnelOptions): Promise<Tunnel>;
}
