import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/lib/react-query/auth-query";

const UserMenu = () => {
  const { mutate } = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors outline-none">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gray-900 text-white text-sm">A</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-gray-700">Admin</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-5 rounded-md bg-white" align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => mutate()}
          className="cursor-pointer font-medium text-red-500 hover:text-red-600"
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
