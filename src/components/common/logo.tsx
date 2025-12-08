import { cn } from "@/lib/utils";

type Props = {
    className?: string;
    thickness?: "thin" | "thick";
};

const Logo = ({ className, thickness = 'thin' }: Props) => {

    return <div className={cn(thickness == 'thin' ? 'font-bold' : 'font-black', className)}>
        {/* <img src="/images/logos/logo.svg" alt="logo" className="w-12" /> */}
        <h1 className="text-xl">DJ</h1>
    </div>
}
export default Logo;