export default program => {
  program
    .name('npx webdetta')
    .usage("<command>")
    .version('1.0.0')
    .configureHelp({
      subcommandTerm: cmd => cmd.name() + cmd.usage().replace('[options]', '')
    })
    .helpCommand(false);

  program.command('help')
    .argument('[command]')
    .action(function () {
      if (this.args[0]) {
        const cmd = this.parent.commands.find(c => c._name == this.args[0]);
        if (!cmd) console.error('Unknown command: ', this.args[0]);
        else console.log(cmd.helpInformation());
      }
      else {
        console.log(program.help());
      }
    });
}
