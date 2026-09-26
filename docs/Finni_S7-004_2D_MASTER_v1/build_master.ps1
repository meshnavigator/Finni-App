param(
  [Parameter(Mandatory = $true)]
  [string]$GeneratedRoomPath
)

$ErrorActionPreference = 'Stop'

$packageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$layersDir = Join-Path $packageRoot 'layers'
$exportsDir = Join-Path $packageRoot 'exports'
$sourceDir = Join-Path $packageRoot 'source'
$tempDir = Join-Path $packageRoot '.build-ora'
$pocRoot = Join-Path (Split-Path -Parent $packageRoot) 'Finni_S7-002_2D_POC'
$neutralSource = Join-Path $pocRoot 'finni_ref001_cutout_v1.png'
$blinkSource = Join-Path $pocRoot 'finni_ref001_blink_v1.png'

$roomLayer = Join-Path $layersDir 'room_clean_v1.png'
$neutralLayer = Join-Path $layersDir 'pet_neutral_canvas_v1.png'
$blinkLayer = Join-Path $layersDir 'pet_blink_canvas_v1.png'
$neutralExport = Join-Path $exportsDir 'home_neutral_v1.png'
$blinkExport = Join-Path $exportsDir 'home_blink_v1.png'
$previewExport = Join-Path $exportsDir 'acceptance_preview_v1.jpg'
$oraPath = Join-Path $sourceDir 'finni_home_layered_master_v1.ora'

foreach ($path in @($GeneratedRoomPath, $neutralSource, $blinkSource)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
    throw "Required source is missing: $path"
  }
}

foreach ($directory in @($layersDir, $exportsDir, $sourceDir)) {
  New-Item -ItemType Directory -Force -Path $directory | Out-Null
}

Copy-Item -LiteralPath $GeneratedRoomPath -Destination $roomLayer -Force

$ffmpeg = (Get-Command ffmpeg -ErrorAction Stop).Source

function Invoke-Ffmpeg {
  param([string[]]$Arguments)
  & $ffmpeg @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "ffmpeg failed with exit code $LASTEXITCODE"
  }
}

$canvasFilter = 'color=c=black@0.0:s=941x1672,format=rgba[base];[0:v]scale=520:-1,format=rgba[pet];[base][pet]overlay=(W-w)/2:720:format=auto[out]'

Invoke-Ffmpeg @(
  '-y', '-i', $neutralSource,
  '-filter_complex', $canvasFilter,
  '-map', '[out]', '-frames:v', '1', '-update', '1', $neutralLayer
)

Invoke-Ffmpeg @(
  '-y', '-i', $blinkSource,
  '-filter_complex', $canvasFilter,
  '-map', '[out]', '-frames:v', '1', '-update', '1', $blinkLayer
)

Invoke-Ffmpeg @(
  '-y', '-i', $roomLayer, '-i', $neutralLayer,
  '-filter_complex', '[0:v][1:v]overlay=0:0:format=auto[out]',
  '-map', '[out]', '-frames:v', '1', '-update', '1', $neutralExport
)

Invoke-Ffmpeg @(
  '-y', '-i', $roomLayer, '-i', $blinkLayer,
  '-filter_complex', '[0:v][1:v]overlay=0:0:format=auto[out]',
  '-map', '[out]', '-frames:v', '1', '-update', '1', $blinkExport
)

Invoke-Ffmpeg @(
  '-y', '-i', $neutralExport, '-i', $blinkExport,
  '-filter_complex', '[0:v]scale=-1:720[n];[1:v]scale=-1:720[b];[n][b]hstack=inputs=2[out]',
  '-map', '[out]', '-frames:v', '1', '-update', '1', $previewExport
)

if (Test-Path -LiteralPath $tempDir) {
  Remove-Item -LiteralPath $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path (Join-Path $tempDir 'data') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $tempDir 'Thumbnails') | Out-Null

Copy-Item -LiteralPath $roomLayer -Destination (Join-Path $tempDir 'data\room.png')
Copy-Item -LiteralPath $neutralLayer -Destination (Join-Path $tempDir 'data\pet-neutral.png')
Copy-Item -LiteralPath $blinkLayer -Destination (Join-Path $tempDir 'data\pet-blink.png')
Copy-Item -LiteralPath $neutralExport -Destination (Join-Path $tempDir 'mergedimage.png')

Invoke-Ffmpeg @(
  '-y', '-i', $neutralExport,
  '-vf', 'scale=256:256:force_original_aspect_ratio=decrease,pad=256:256:(ow-iw)/2:(oh-ih)/2:white',
  '-frames:v', '1', '-update', '1', (Join-Path $tempDir 'Thumbnails\thumbnail.png')
)

$stackXml = @'
<?xml version="1.0" encoding="UTF-8"?>
<image version="0.0.1" w="941" h="1672" name="Finni Home layered master v1">
  <stack name="Finni Home v1">
    <layer name="Pet neutral (visible)" src="data/pet-neutral.png" visibility="visible" composite-op="svg:src-over" />
    <layer name="Pet blink (toggle)" src="data/pet-blink.png" visibility="hidden" composite-op="svg:src-over" />
    <layer name="Room clean" src="data/room.png" visibility="visible" composite-op="svg:src-over" />
  </stack>
</image>
'@
[IO.File]::WriteAllText((Join-Path $tempDir 'stack.xml'), $stackXml, [Text.UTF8Encoding]::new($false))

Add-Type -AssemblyName System.IO.Compression
if (Test-Path -LiteralPath $oraPath) {
  Remove-Item -LiteralPath $oraPath -Force
}

$archive = [IO.Compression.ZipFile]::Open($oraPath, [IO.Compression.ZipArchiveMode]::Create)
try {
  $mimetypeEntry = $archive.CreateEntry('mimetype', [IO.Compression.CompressionLevel]::NoCompression)
  $writer = [IO.StreamWriter]::new($mimetypeEntry.Open(), [Text.UTF8Encoding]::new($false))
  try { $writer.Write('image/openraster') } finally { $writer.Dispose() }

  foreach ($relativePath in @(
    'stack.xml',
    'mergedimage.png',
    'Thumbnails/thumbnail.png',
    'data/room.png',
    'data/pet-neutral.png',
    'data/pet-blink.png'
  )) {
    $sourcePath = Join-Path $tempDir ($relativePath -replace '/', '\')
    $entry = $archive.CreateEntry($relativePath, [IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    $sourceStream = [IO.File]::OpenRead($sourcePath)
    try { $sourceStream.CopyTo($entryStream) } finally {
      $sourceStream.Dispose()
      $entryStream.Dispose()
    }
  }
} finally {
  $archive.Dispose()
}

Remove-Item -LiteralPath $tempDir -Recurse -Force

$artifactFiles = Get-ChildItem -LiteralPath $packageRoot -Recurse -File |
  Where-Object { $_.Name -ne 'SHA256SUMS.txt' } |
  Sort-Object FullName

$hashLines = foreach ($file in $artifactFiles) {
  $relative = $file.FullName.Substring($packageRoot.Length + 1).Replace('\', '/')
  $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $file.FullName).Hash.ToLowerInvariant()
  "$hash  $relative"
}
[IO.File]::WriteAllLines((Join-Path $packageRoot 'SHA256SUMS.txt'), $hashLines, [Text.UTF8Encoding]::new($false))

Write-Output "Built $oraPath"
