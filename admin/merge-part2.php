<?php

$final = __DIR__ . '/cache_tabs_part2.json';
$temp  = $final . '.tmp';

$fp = fopen($temp, 'w');

fwrite($fp, '{');
fwrite($fp, '"tabs":[');

$first = true;

for ($i = 5; $i <= 7; $i++) {

    $file = __DIR__ . "/cache_tab_$i.json";
    $json = file_get_contents($file);

    if (preg_match('/"tabs"\s*:\s*\[(.*)\]\s*,/s', $json, $m)) {

        if (!$first) fwrite($fp, ',');
        $first = false;

        fwrite($fp, trim($m[1]));
    }
}

fwrite($fp, ']');

// global data (optional, can skip but safe to include)
$json = file_get_contents(__DIR__ . "/cache_tab_1.json");

preg_match('/"height_width_prices"\s*:\s*(\[[^\]]*\])/', $json, $m);
fwrite($fp, ',"height_width_prices":' . $m[1]);

preg_match('/"combo_options"\s*:\s*(\[[^\]]*\])/', $json, $m);
fwrite($fp, ',"combo_options":' . $m[1]);

fwrite($fp, '}');

fclose($fp);
rename($temp, $final);

echo "Part2 ready";