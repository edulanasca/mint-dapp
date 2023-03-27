import {CreateToastFnReturn, ToastId} from "@chakra-ui/react";

export function handleError(title: string, err: any, toast: CreateToastFnReturn, toastId?: ToastId) {
  if (process.env.NODE_ENV === "development") console.log(err)
  if (toastId) toast.close(toastId);
  return toast({
    title,
    description: err.toString(),
    status: "error",
    duration: 5000,
    isClosable: true
  })
}