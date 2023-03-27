import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import {FC, useMemo, useState} from "react";
import {Box, BoxProps} from "@chakra-ui/react";

dayjs.extend(duration);

interface CountdownProps extends BoxProps {
  endTime: number;
}

const Countdown: FC<CountdownProps> = ({ endTime, ...props }) => {
  const [time, setTime] = useState<string>();

  useMemo(() => {
    const currentTime = dayjs();
    const diffTime = endTime - currentTime.unix();

    let duration = dayjs.duration(diffTime * 1000, "milliseconds");
    const interval = 1000;
    const twoDP = (n: number) => (n > 9 ? n : "0" + n);

    setInterval(function () {
      duration = dayjs.duration(duration.asMilliseconds() - interval, "milliseconds");

      let timestamp = `
      ${duration.days() !== 0 ? duration.days() + "d " : ""}
      ${duration.hours()}h 
      ${twoDP(duration.minutes())}m 
      ${twoDP(duration.seconds())}s
      `;

      setTime(timestamp);
    }, interval);
  }, [endTime]);

  return <Box {...props}>{time}</Box>;
}

export default Countdown;