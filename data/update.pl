#!/usr/bin/perl

use Cwd qw(abs_path);
use Data::Dumper;
use JSON::XS;
use POSIX qw(strftime);


# Get the real base directory for this script
my $basedir = "./";
if(abs_path($0) =~ /^(.*\/)[^\/]*/){ $basedir = $1; }

$basedir .= "../";

$idir = $basedir."data/";
$odir = $basedir."docs/gw/BF09C01672351154C152349A7F011C6DBB40A4A0/";
$wwdir = $basedir."data/GW/waveforms/";
$wsdir = $basedir."data/GW/templates/";
$wodir = $basedir."docs/gw/waveform-fitter/waveforms/";
$dp = 3;


# Open the scenario file for GW
$file = $idir."scenario-1.json";
open(FILE,$file);
@lines = <FILE>;
close(FILE);
eval { $json = JSON::XS->new->utf8->decode(join("",@lines)); }
or do { $json = {}; };

# Add generation note
$json->{'_notes'} = "Created by data/update.pl from data/scenario-1.json";
$json->{'_update'} = strftime("%FT%TZ",gmtime);

# Trim decimal places in grid map values
foreach $ev (sort(keys(%{$json->{'events'}}))){
	foreach $det (sort(keys(%{$json->{'events'}{$ev}{'GW'}{'dt_arr_ms'}}))){
		for($i = 0; $i < @{$json->{'events'}{$ev}{'GW'}{'dt_arr_ms'}{$det}}; $i++){
			for($j = 0; $j < @{$json->{'events'}{$ev}{'GW'}{'dt_arr_ms'}{$det}[$i]}; $j++){
				$json->{'events'}{$ev}{'GW'}{'dt_arr_ms'}{$det}[$i][$j] = sprintf("%0.".$dp."f",$json->{'events'}{$ev}{'GW'}{'dt_arr_ms'}{$det}[$i][$j])+0;
			}
		}
	}
	foreach $f (sort(keys(%{$json->{'events'}{$ev}{'GW'}{'files'}}))){
		if($f =~ /\_csv/){
			if($f =~ /waveform/){
				$w = $wwdir;
			}else{
				$w = $wsdir;
			}
			if(-e $w.$json->{'events'}{$ev}{'GW'}{'files'}{$f}){
				print "Copying $w$json->{'events'}{$ev}{'GW'}{'files'}{$f} to $wodir\n";
				`cp $w$json->{'events'}{$ev}{'GW'}{'files'}{$f} $wodir$json->{'events'}{$ev}{'GW'}{'files'}{$f}`;
			}else{
				print "Can't copy $w$json->{'events'}{$ev}{'GW'}{'files'}{$f}\n";
			}
		}
	}
	
}

saveJSON($odir."scenario-1.json",$json);

$opts = "";
foreach $ev (sort(keys(%{$json->{'events'}}))){
	if(!$json->{'events'}{$ev}{'name'}){
		print "Missing name for $ev\n";
	}
	if(!$json->{'events'}{$ev}{'datetime'}){
		print "Missing datetime for $ev\n";
	}
	if(!$json->{'events'}{$ev}{'GW'}){
		print "Missing GW for $ev\n";
	}
	if(!$json->{'events'}{$ev}{'GW'}{'files'}){
		print "Missing GW->files for $ev\n";
	}
	if(!$json->{'events'}{$ev}{'GW'}{'files'}{'waveform_csv'}){
		print "Missing GW->files->waveform_csv for $ev\n";
	}
	if(!$json->{'events'}{$ev}{'GW'}{'files'}{'simulations_csv'}){
		print "Missing GW->files->simulations_csv for $ev\n";
	}
	$opts .= "<option value=\"$ev\">$json->{'events'}{$ev}{'name'}</option>\n";
}
#partOfHTML($odir."index.html",{"EVENT"=>$opts});
partOfHTML($odir."1.html",{"EVENT"=>$opts});




##############
# SUBROUTINES
sub partOfHTML {
	my $file = shift;
	my $repl = $_[0];

	local(@lines,$indent,$str,$code,$frag,$rep);

	open(FILE,$file);
	@lines = <FILE>;
	close(FILE);
	$str = join("",@lines);

	foreach $code (keys(%{$repl})){

		$indent = "";	
		$str =~ s/[\n\r]/\=\=\=NEWLINE\=\=\=/g;
		if($str =~ /(<!-- $code START -->)(.*)(<!-- $code END -->)/){

			$frag = $2."";
			$indent = "";
			$frag =~ s/\=\=\=NEWLINE\=\=\=/\n/g;
			if($frag =~ /^(\n\t+)/){
				$indent = $1;
			}
			$rep = $repl->{$code};
			$rep =~ s/\n/$indent/g;
			$rep = $indent.$rep;
			$str =~ s/(<!-- $code START -->).*(<!-- $code END -->)/$1$rep$2/g;
		}
		$str =~ s/\=\=\=NEWLINE\=\=\=/\n/g;
	}
	open(FILE,">",$file);
	print FILE $str;
	close(FILE);
#	<!-- EVENT START -->
#	<option value="LVKyymmdd_hhmmss A" data-date="dd-mmm-yy hh:mm:ss GMT" data-waveform="data/dataHanford.csv">LVKyymmdd_hhmmss A</option>
#	<option value="LVKyymmdd_hhmmss B" data-date="dd-mmm-yy hh:mm:ss GMT" data-waveform="waveforms/GW170817_waveform.csv">LVKyymmdd_hhmmss B</option>
#	<option value="LVKyymmdd_hhmmss C" data-date="dd-mmm-yy hh:mm:ss GMT" data-waveform="waveforms/GW170817_waveform.csv">LVKyymmdd_hhmmss C</option>
#	<!-- EVENT END -->
	
}

sub saveJSON {
	my $file = shift;
	my $json = $_[0];

	$str = JSON::XS->new->utf8->canonical->pretty->encode($json);

	# Clean up

	# Swap spaces for tabs
	$str =~ s/   /\t/g;	

	# Compress number arrays
	$str =~ s/\n\t{7}([0-9\.\-]+)/$1/g;
	$str =~ s/\[\n\t{6}\[/\[\[/g;
	$str =~ s/\n\t{6}\],\n\t{6}\[/\],\[/g;
	$str =~ s/\n\t{6}\]\n\t{5}\]/\]\]/g;

	# Save the file
	open(JSON,">",$file);
	print JSON $str;
	close(JSON);

	return;
}