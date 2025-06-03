export function Sponsors() {
	return (
		<div className="bg-gradient-to-b from-zinc-100 to-zinc-50 py-20 dark:from-zinc-900 dark:to-zinc-950">
			<div className="px-5 md:px-10">
				<div className="mx-auto w-full max-w-7xl">
					<div className="mb-10 text-center md:mb-16">
						<h2 className="mb-4 text-2xl font-bold md:text-3xl lg:text-4xl">Our sponsors</h2>
						<p className="mx-auto max-w-2xl text-zinc-600 dark:text-zinc-400">
							These amazing people and companies help keep next-safe-action running! ❤️
						</p>
					</div>

					<div id="sponsors-container" className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
						<h3 className="text-xl font-bold md:text-2xl">🥉 Enthusiasts (Bronze)</h3>

						<table>
							<tr>
								<td align="center">
									<a href="https://launch.arcjet.com/Wk7JBrE" target="_blank">
										<img src="https://avatars.githubusercontent.com/u/24397786?s=120&v=4" width="120" alt="ArcJet" />
										<br />
										ArcJet
									</a>
								</td>
							</tr>
						</table>

						<h3 className="mb-4 text-xl font-bold md:text-2xl">☕ Supporters</h3>

						<table>
							<tr>
								<td align="center">
									<a href="https://github.com/pontusab" target="_blank">
										<img
											src="https://avatars.githubusercontent.com/u/655158?s=80&v=4"
											width="80"
											alt="Pontus Abrahamsson"
										/>
										<br />
										Pontus Abrahamsson
									</a>
								</td>
								<td align="center">
									<a href="https://www.robinwieruch.de" target="_blank">
										<img
											src="https://avatars.githubusercontent.com/u/2479967?s=80&v=4"
											width="80"
											alt="Robin Wieruch"
										/>
										<br />
										Robin Wieruch
									</a>
								</td>
							</tr>
						</table>

						<h3 className="mb-4 text-xl font-bold md:text-2xl">👷 Past sponsors</h3>

						<table>
							<tr>
								<td align="center">
									<a href="https://vercel.com" target="_blank">
										<img src="https://avatars.githubusercontent.com/u/14985020?s=50&v=4" width="50" alt="Vercel" />
										<br />
										Vercel
									</a>
								</td>
								<td align="center">
									<a href="https://liam.so" target="_blank">
										<img
											src="https://avatars.githubusercontent.com/u/38444224?v=4&size=50"
											width="50"
											alt="Liam Murray"
										/>
										<br />
										Liam Murray
									</a>
								</td>
								<td align="center">
									<a href="https://chalifoux.dev" target="_blank">
										<img
											src="https://avatars.githubusercontent.com/u/3289533?v=4&size=50"
											width="50"
											alt="David Chalifoux"
										/>
										<br />
										David Chalifoux
									</a>
								</td>
								<td align="center">
									<a href="https://www.undheim.io" target="_blank">
										<img
											src="https://avatars.githubusercontent.com/u/46612252?v=4&size=50"
											width="50"
											alt="Rein Undheim"
										/>
										<br />
										Rein Undheim
									</a>
								</td>
								<td align="center">
									<a href="https://github.com/merthanmerter" target="_blank">
										<img
											src="https://avatars.githubusercontent.com/u/7555905?v=4&size=50"
											width="50"
											alt="Merthan Merter"
										/>
										<br />
										Merthan Merter
									</a>
								</td>
								<td align="center">
									<a href="https://github.com/marcotommoro" target="_blank">
										<img
											src="https://avatars.githubusercontent.com/u/65455109?v=4&size=50"
											width="50"
											alt="Marco Moroni"
										/>
										<br />
										Marco Moroni
									</a>
								</td>
								<td align="center">
									<a href="https://github.com/gvffelisberto" target="_blank">
										<img
											src="https://avatars.githubusercontent.com/u/17497942?v=4&size=50"
											width="50"
											alt="Gustavo Felisberto"
										/>
										<br />
										Gustavo Felisberto
									</a>
								</td>
							</tr>
						</table>
					</div>

					<div className="mt-10 text-center">
						<a
							href="https://github.com/sponsors/theedoran"
							className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-base font-semibold !text-white !no-underline transition-all after:ml-2 hover:translate-y-[-2px] hover:shadow-lg hover:after:content-['🚀'] md:text-lg dark:bg-white dark:!text-zinc-900"
						>
							Sponsor the project
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
